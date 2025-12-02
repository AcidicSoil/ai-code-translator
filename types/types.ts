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