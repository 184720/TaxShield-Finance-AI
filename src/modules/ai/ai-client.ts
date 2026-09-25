import type { AIProvider } from './types';
import { createLLMProvider } from './llm-provider';

// Public builds always try the same-origin Qwen proxy first. Mock is reachable
// only inside createLLMProvider when timeout/API/schema validation fails.
export const aiClient: AIProvider = createLLMProvider('qwen');
export const aiMode = 'qwen' as const;
