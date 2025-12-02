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