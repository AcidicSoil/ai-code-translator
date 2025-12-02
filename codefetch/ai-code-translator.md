<source_code>
pages/_app.tsx
```
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

function App({ Component, pageProps }: AppProps<{}>) {
  return (
    <main className={inter.className}>
      <Component {...pageProps} />
    </main>
  );
}

export default App;
```

pages/_document.tsx
```
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

pages/index.tsx
```
import { APIKeyInput } from '@/components/APIKeyInput';
import { CodeBlock } from '@/components/CodeBlock';
import { LanguageSelect } from '@/components/LanguageSelect';
import { ModelSelect } from '@/components/ModelSelect';
import { TextBlock } from '@/components/TextBlock';
import { TranslateBody } from '@/types/types';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getModelConfig } from '@/types/model';
import type { ModelId } from '@/types/model';

export default function Home() {
  const [inputLanguage, setInputLanguage] = useState<string>('JavaScript');
  const [outputLanguage, setOutputLanguage] = useState<string>('Python');
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [model, setModel] = useState<ModelId>('lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasTranslated, setHasTranslated] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');

  const handleTranslate = async () => {
    const { provider, maxCodeLength } = getModelConfig(model);

    if (!apiKey && provider !== 'lmstudio') {
      alert('Please enter an API key.');
      return;
    }

    if (inputLanguage === outputLanguage) {
      alert('Please select different languages.');
      return;
    }

    if (!inputCode) {
      alert('Please enter some code.');
      return;
    }

    if (inputCode.length > maxCodeLength) {
      alert(
        `Please enter code less than ${maxCodeLength} characters. You are currently at ${inputCode.length} characters.`,
      );
      return;
    }

    setLoading(true);
    setOutputCode('');

    const controller = new AbortController();

    const body: TranslateBody = {
      inputLanguage,
      outputLanguage,
      inputCode,
      model,
      provider,
      apiKey,
    };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setLoading(false);
      alert('Something went wrong.');
      return;
    }

    const data = response.body;

    if (!data) {
      setLoading(false);
      alert('Something went wrong.');
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let code = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      code += chunkValue;

      setOutputCode((prevCode) => prevCode + chunkValue);
    }

    setLoading(false);
    setHasTranslated(true);
    copyToClipboard(code);
  };

  const copyToClipboard = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);

    localStorage.setItem('apiKey', value);
  };

  useEffect(() => {
    if (hasTranslated) {
      handleTranslate();
    }
  }, [outputLanguage]);

  useEffect(() => {
    const apiKey = localStorage.getItem('apiKey');

    if (apiKey) {
      setApiKey(apiKey);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Code Translator</title>
        <meta
          name="description"
          content="Use AI to translate code from one language to another."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-full min-h-screen flex-col items-center bg-[#0E1117] px-4 pb-20 text-neutral-200 sm:px-10">
        <div className="mt-10 flex flex-col items-center justify-center sm:mt-20">
          <div className="text-4xl font-bold">AI Code Translator</div>
        </div>

        <div className="mt-6 text-center text-sm">
          <APIKeyInput apiKey={apiKey} onChange={handleApiKeyChange} />
        </div>

        <div className="mt-2 flex items-center space-x-2">
          <ModelSelect model={model} onChange={(value) => setModel(value)} />

          <button
            className="w-[140px] cursor-pointer rounded-md bg-violet-500 px-4 py-2 font-bold hover:bg-violet-600 active:bg-violet-700"
            onClick={() => handleTranslate()}
            disabled={loading}
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
        </div>

        <div className="mt-2 text-center text-xs">
          {loading
            ? 'Translating...'
            : hasTranslated
            ? 'Output copied to clipboard!'
            : 'Enter some code and click "Translate"'}
        </div>

        <div className="mt-6 flex w-full max-w-[1200px] flex-col justify-between sm:flex-row sm:space-x-4">
          <div className="h-100 flex flex-col justify-center space-y-2 sm:w-2/4">
            <div className="text-center text-xl font-bold">Input</div>

            <LanguageSelect
              language={inputLanguage}
              onChange={(value) => {
                setInputLanguage(value);
                setHasTranslated(false);
                setInputCode('');
                setOutputCode('');
              }}
            />

            {inputLanguage === 'Natural Language' ? (
              <TextBlock
                text={inputCode}
                editable={!loading}
                onChange={(value) => {
                  setInputCode(value);
                  setHasTranslated(false);
                }}
              />
            ) : (
              <CodeBlock
                code={inputCode}
                editable={!loading}
                onChange={(value) => {
                  setInputCode(value);
                  setHasTranslated(false);
                }}
              />
            )}
          </div>
          <div className="mt-8 flex h-full flex-col justify-center space-y-2 sm:mt-0 sm:w-2/4">
            <div className="text-center text-xl font-bold">Output</div>

            <LanguageSelect
              language={outputLanguage}
              onChange={(value) => {
                setOutputLanguage(value);
                setOutputCode('');
              }}
            />

            {outputLanguage === 'Natural Language' ? (
              <TextBlock text={outputCode} />
            ) : (
              <CodeBlock code={outputCode} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
```

pages/api/translate.ts
```
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

components/APIKeyInput.tsx
```
import { Icon2fa } from '@tabler/icons-react';
import { FC } from 'react';

interface Props {
  apiKey: string;
  onChange: (apiKey: string) => void;
}

export const APIKeyInput: FC<Props> = ({ apiKey, onChange }) => {
  return (
    <div className="relative">
      <Icon2fa className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input
        className="w-full rounded-lg border border-neutral-600 bg-[#15161A] py-2 pl-10 pr-12 text-neutral-200 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        type="password"
        value={apiKey}
        onChange={(e) => onChange(e.target.value)}
        placeholder="API Key"
      />
    </div>
  );
};
```

components/CodeBlock.tsx
```
import { StreamLanguage } from '@codemirror/language';
import { go } from '@codemirror/legacy-modes/mode/go';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import CodeMirror from '@uiw/react-codemirror';
import { FC, useEffect, useState } from 'react';

interface Props {
  code: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}

export const CodeBlock: FC<Props> = ({
  code,
  editable = false,
  onChange = () => {},
}) => {
  const [copyText, setCopyText] = useState<string>('Copy');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCopyText('Copy');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [copyText]);

  return (
    <div className="relative">
      <button
        className="absolute right-0 top-0 z-10 rounded bg-[#1A1B26] p-1 text-xs text-white hover:bg-[#2D2E3A] active:bg-[#2D2E3A]"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopyText('Copied!');
        }}
      >
        {copyText}
      </button>

      <CodeMirror
        editable={editable}
        value={code}
        minHeight="500px"
        extensions={[StreamLanguage.define(go)]}
        theme={tokyoNight}
        onChange={(value) => onChange(value)}
      />
    </div>
  );
};
```

components/LanguageSelect.tsx
```
import type { FC } from 'react';

interface Props {
  language: string;
  onChange: (language: string) => void;
}

export const LanguageSelect: FC<Props> = ({ language, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select
      className="w-full rounded-md bg-[#1F2937] px-4 py-2 text-neutral-200"
      value={language}
      onChange={handleChange}
    >
      {languages
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
    </select>
  );
};

const languages = [
  { value: 'Pascal', label: 'Pascal' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'TSX', label: 'TSX' },
  { value: 'JSX', label: 'JSX' },
  { value: 'Vue', label: 'Vue' },
  { value: 'Go', label: 'Go' },
  { value: 'C', label: 'C' },
  { value: 'C++', label: 'C++' },
  { value: 'Java', label: 'Java' },
  { value: 'C#', label: 'C#' },
  { value: 'Visual Basic .NET', label: 'Visual Basic .NET' },
  { value: 'SQL', label: 'SQL' },
  { value: 'Assembly Language', label: 'Assembly Language' },
  { value: 'PHP', label: 'PHP' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'Swift', label: 'Swift' },
  { value: 'SwiftUI', label: 'SwiftUI' },
  { value: 'Kotlin', label: 'Kotlin' },
  { value: 'R', label: 'R' },
  { value: 'Objective-C', label: 'Objective-C' },
  { value: 'Perl', label: 'Perl' },
  { value: 'SAS', label: 'SAS' },
  { value: 'Scala', label: 'Scala' },
  { value: 'Dart', label: 'Dart' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Haskell', label: 'Haskell' },
  { value: 'Lua', label: 'Lua' },
  { value: 'Groovy', label: 'Groovy' },
  { value: 'Elixir', label: 'Elixir' },
  { value: 'Clojure', label: 'Clojure' },
  { value: 'Lisp', label: 'Lisp' },
  { value: 'Julia', label: 'Julia' },
  { value: 'Matlab', label: 'Matlab' },
  { value: 'Fortran', label: 'Fortran' },
  { value: 'COBOL', label: 'COBOL' },
  { value: 'Bash', label: 'Bash' },
  { value: 'Powershell', label: 'Powershell' },
  { value: 'PL/SQL', label: 'PL/SQL' },
  { value: 'CSS', label: 'CSS' },
  { value: 'Racket', label: 'Racket' },
  { value: 'HTML', label: 'HTML' },
  { value: 'NoSQL', label: 'NoSQL' },
  { value: 'Natural Language', label: 'Natural Language' },
  { value: 'CoffeeScript', label: 'CoffeeScript' },
];
```

components/ModelSelect.tsx
```
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

components/TextBlock.tsx
```
interface Props {
  text: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}

export const TextBlock: React.FC<Props> = ({
  text,
  editable = false,
  onChange = () => {},
}) => {
  return (
    <textarea
      className="min-h-[500px] w-full bg-[#1A1B26] p-4 text-[15px] text-neutral-200 focus:outline-none"
      style={{ resize: 'none' }}
      value={text}
      onChange={(e) => onChange(e.target.value)}
      disabled={!editable}
    />
  );
};
```

types/model.ts
```
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
    id: 'lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF',
    label: 'Llama 3 8B',
    provider: 'lmstudio',
    maxCodeLength: 8000,
  },
  {
    id: 'lmstudio-community/gemma-2-9b-it-GGUF',
    label: 'Gemma 2 9B',
    provider: 'lmstudio',
    maxCodeLength: 8000,
  },
];

export const getModelConfig = (id: ModelId): ModelConfig => {
  const model = MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  return model;
};
```

types/provider.ts
```
// types/provider.ts (new file)
export type ProviderId = 'lmstudio' | string;
```

types/types.ts
```
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

utils/index.ts
```
```

utils/providers/base.ts
```
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

utils/providers/index.ts
```
// utils/providers/index.ts (new file)
import { registerProvider, getProvider } from './base';
import { LMStudioProvider } from './lmstudio';
import { getModelConfig } from '@/types/model';

registerProvider(LMStudioProvider);

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

utils/providers/lmstudio.ts
```
// utils/providers/lmstudio.ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { Provider, ProviderRequest } from './base';
import endent from 'endent';

const createPrompt = (
  inputLanguage: string,
  outputLanguage: string,
  inputCode: string,
) => {
    if (inputLanguage === 'Natural Language') {
    return endent`
    You are an expert programmer in all programming languages. Translate the natural language to "${outputLanguage}" code. Do not include

Example translating from natural language to JavaScript:

Natural language:
Print the numbers 0 to 9.

JavaScript code:
for (let i = 0; i < 10; i++) {
      console.log(i);
    }

Natural language:
${inputCode}

${outputLanguage} code (no ):
    `;
} else if (outputLanguage === 'Natural Language') {
    return endent`
    You are an expert programmer in all programming languages. Translate the "${inputLanguage}" code to natural language in plain English that the average adult could understand. Respond as bullet points starting with -.

Example translating from JavaScript to natural language:

JavaScript code:
for (let i = 0; i < 10; i++) {
        console.log(i);
    }

Natural language:
Print the numbers 0 to 9.

    ${inputLanguage} code:
    ${inputCode}

    Natural language:
    `;
} else {
    return endent`
    You are an expert programmer in all programming languages. Translate the "${inputLanguage}" code to "${outputLanguage}" code. Do not include

Example translating from JavaScript to Python:

JavaScript code:
for (let i = 0; i < 10; i++) {
        console.log(i);
    }

Python code:
for i in range(10):
        print(i)

    ${inputLanguage} code:
    ${inputCode}

    ${outputLanguage} code (no ):
    `;
}
};

const lmstudio = createOpenAICompatible({
    name: 'lm-studio',
    baseURL: 'http://localhost:1234/v1',
});

const streamTranslate: Provider['streamTranslate'] = async ({
    inputLanguage,
    outputLanguage,
    inputCode,
    model,
}) => {
    const prompt = createPrompt(inputLanguage, outputLanguage, inputCode);

    const result = await streamText({
        model: lmstudio(model),
        system: prompt,
        messages: [],
    });

    return result.toReadableStream();
};

export const LMStudioProvider: Provider = {
    id: 'lmstudio',
    streamTranslate,
};
```

utils/providers/openai.ts
```
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

  const res = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
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

</source_code>