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
