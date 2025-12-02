Current state (single provider, tightly coupled)

From the code snapshot:

* The only provider is OpenAI, hard-wired in `utils/index.ts` via `OpenAIStream` calling `https://api.openai.com/v1/chat/completions`.
* The API layer (`pages/api/translate.ts`) calls `OpenAIStream` directly, no provider abstraction.
* Frontend model selection is a union of OpenAI models (`OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4'`) with a UI that assumes “OpenAI model” semantics.
* The API key input is labeled “OpenAI API Key” and is globally used, not per provider.

You need a provider-agnostic core that:

* Encodes translation prompt logic once (already in `createPrompt`).
* Routes the request through a registry of providers.
* Lets the UI choose provider + model from a single configuration source.

Below is an extensible workflow and exactly which files to touch.

---

Long-term provider integration design

Core concepts to introduce:

1. Provider identifiers

```ts
// types/provider.ts (new file)
export type ProviderId = 'openai' | 'anthropic' | 'azure-openai' | 'deepseek' | string;
```

2. Model identifiers and registry

```ts
// types/model.ts (new file)
import { ProviderId } from './provider';

export type ModelId = string;

export interface ModelConfig {
  id: ModelId;
  label: string;
  provider: ProviderId;
  maxCodeLength: number;
}

export const MODELS: ModelConfig[] = [
  {
    id: 'gpt-3.5-turbo',
    label: 'GPT-3.5',
    provider: 'openai',
    maxCodeLength: 6000,
  },
  {
    id: 'gpt-4',
    label: 'GPT-4',
    provider: 'openai',
    maxCodeLength: 12000,
  },
  // future: add other providers’ models here
];

export const getModelConfig = (id: ModelId): ModelConfig => {
  const model = MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  return model;
};
```

3. Provider interface and registry

```ts
// utils/providers/base.ts (new file)
import type { ReadableStream } from 'web-streams-polyfill/ponyfill';

export interface ProviderRequest {
  inputLanguage: string;
  outputLanguage: string;
  inputCode: string;
  model: string;        // concrete provider model id
  apiKey?: string;      // optional user key, else env
}

export interface Provider {
  id: string;
  streamTranslate: (req: ProviderRequest) => Promise<ReadableStream<Uint8Array>>;
}

// Simple registry
const providers = new Map<string, Provider>();

export const registerProvider = (provider: Provider) => {
  providers.set(provider.id, provider);
};

export const getProvider = (id: string): Provider => {
  const provider = providers.get(id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
};
```

4. OpenAI provider implementation (refactor of `OpenAIStream`)

Move the streaming logic out of `utils/index.ts` into `utils/providers/openai.ts`:

```ts
// utils/providers/openai.ts
import endent from 'endent';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';
import { Provider, ProviderRequest } from './base';

const createPrompt = (
  inputLanguage: string,
  outputLanguage: string,
  inputCode: string,
) => {
  // move existing createPrompt here unchanged
};

const streamTranslate: Provider['streamTranslate'] = async ({
  inputLanguage,
  outputLanguage,
  inputCode,
  model,
  apiKey,
}) => {
  const prompt = createPrompt(inputLanguage, outputLanguage, inputCode);
  const system = { role: 'system', content: prompt };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey || process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model,
      messages: [system],
      temperature: 0,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const statusText = res.statusText;
    const result = await res.body?.getReader().read();
    throw new Error(
      `OpenAI API returned an error: ${
        decoder.decode(result?.value) || statusText
      }`,
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;
          if (data === '[DONE]') {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0]?.delta?.content || '';
            if (!text) return;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};

export const OpenAIProvider: Provider = {
  id: 'openai',
  streamTranslate,
};
```

5. Provider registration and unified translation entrypoint

```ts
// utils/providers/index.ts (new file)
import { registerProvider, getProvider } from './base';
import { OpenAIProvider } from './openai';
import { getModelConfig } from '@/types/model';

registerProvider(OpenAIProvider);

export const streamCodeTranslation = async (args: {
  inputLanguage: string;
  outputLanguage: string;
  inputCode: string;
  model: string;
  provider: string;
  apiKey?: string;
}) => {
  const provider = getProvider(args.provider);
  const modelConfig = getModelConfig(args.model);

  // sanity: enforced provider from model config
  if (modelConfig.provider !== args.provider) {
    throw new Error(
      `Model ${modelConfig.id} does not belong to provider ${args.provider}`,
    );
  }

  return provider.streamTranslate({
    inputLanguage: args.inputLanguage,
    outputLanguage: args.outputLanguage,
    inputCode: args.inputCode,
    model: modelConfig.id,
    apiKey: args.apiKey,
  });
};
```

---

API layer changes

Change the request types and API handler to use provider + model, not OpenAI-specific types.

1. `types/types.ts`

Replace the existing `OpenAIModel` with generic model/provider:

```ts
// types/types.ts
import type { ProviderId } from './provider';
import type { ModelId } from './model';

export interface TranslateBody {
  inputLanguage: string;
  outputLanguage: string;
  inputCode: string;
  model: ModelId;
  provider: ProviderId;
  apiKey: string; // you can keep one per provider or expand later
}

export interface TranslateResponse {
  code: string;
}
```

2. `pages/api/translate.ts`

Replace direct `OpenAIStream` call with `streamCodeTranslation`:

```ts
// pages/api/translate.ts
import { TranslateBody } from '@/types/types';
import { streamCodeTranslation } from '@/utils/providers';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const {
      inputLanguage,
      outputLanguage,
      inputCode,
      model,
      provider,
      apiKey,
    } = (await req.json()) as TranslateBody;

    const stream = await streamCodeTranslation({
      inputLanguage,
      outputLanguage,
      inputCode,
      model,
      provider,
      apiKey,
    });

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
```

---

Frontend changes

1. Model and provider selection

Update `ModelSelect` to be driven by the shared model registry and to include provider context.

```ts
// components/ModelSelect.tsx
import { FC } from 'react';
import { MODELS, ModelId, getModelConfig } from '@/types/model';

interface Props {
  model: ModelId;
  onChange: (model: ModelId) => void;
}

export const ModelSelect: FC<Props> = ({ model, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as ModelId);
  };

  return (
    <select
      className="h-[40px] w-[220px] rounded-md bg-[#1F2937] px-4 py-2 text-neutral-200"
      value={model}
      onChange={handleChange}
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label} ({m.provider})
        </option>
      ))}
    </select>
  );
};
```

On the page (`pages/index.tsx`) derive provider + maxCodeLength from `model`:

```ts
// inside Home component
import { getModelConfig } from '@/types/model';
import type { ModelId } from '@/types/model';

// state
const [model, setModel] = useState<ModelId>('gpt-3.5-turbo');

// in handleTranslate
const { provider, maxCodeLength } = getModelConfig(model);

const body: TranslateBody = {
  inputLanguage,
  outputLanguage,
  inputCode,
  model,
  provider,
  apiKey,
};
```

This removes the current hard-coded `maxCodeLength` logic tied directly to `OpenAIModel`.

2. API key input

Update the placeholder to be provider-agnostic (e.g., “API Key”) or dynamic based on provider. To keep per-provider keys later, you can store them under `localStorage` keys like `apiKey:<provider>`.

`components/APIKeyInput.tsx` text change only:

```ts
placeholder="API Key"
```

`pages/index.tsx` can then, if desired, load/save per provider, but that is optional for the first pass.

---

Files you need to touch

One-time refactor to establish the extensible workflow:

Existing files to modify:

* `utils/index.ts`

  * Remove `OpenAIStream` and `createPrompt` from here or keep only `createPrompt` and re-export if you prefer; move streaming logic into `utils/providers/openai.ts`.
* `pages/api/translate.ts`

  * Switch from `OpenAIStream(...)` to `streamCodeTranslation(...)` and handle `provider` in the request body.
* `types/types.ts`

  * Replace `OpenAIModel` with `ModelId` + `ProviderId` and extend `TranslateBody` with `provider`.
* `components/ModelSelect.tsx`

  * Drive options from `MODELS` registry; accept `ModelId` instead of `OpenAIModel`.
* `pages/index.tsx`

  * Use new `ModelId` type and `getModelConfig` for `maxCodeLength` and `provider`.
  * Update `handleTranslate` body to include `provider`.
  * Optionally change any OpenAI-specific text.
* `components/APIKeyInput.tsx`

  * Make placeholder provider-agnostic or dynamic.

New files to add (core abstraction):

* `types/provider.ts` – `ProviderId` type.
* `types/model.ts` – `ModelId`, `ModelConfig`, `MODELS`, `getModelConfig`.
* `utils/providers/base.ts` – `Provider` interface, `ProviderRequest`, registry (`registerProvider`, `getProvider`).
* `utils/providers/openai.ts` – OpenAI provider implementing `Provider`.
* `utils/providers/index.ts` – Provider registration and `streamCodeTranslation` entrypoint.

After this refactor, adding a new provider requires only:

* New provider implementation file, e.g. `utils/providers/anthropic.ts` implementing `Provider`.
* Registration line in `utils/providers/index.ts`:

```ts
import { AnthropicProvider } from './anthropic';
registerProvider(AnthropicProvider);
```

* One or more `ModelConfig` entries for that provider in `types/model.ts`.

No changes to `pages/api/translate.ts`, `pages/index.tsx`, `ModelSelect`, or `types/types.ts` should be necessary for future providers if you adhere to this pattern.
