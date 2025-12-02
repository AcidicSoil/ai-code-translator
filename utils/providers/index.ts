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
