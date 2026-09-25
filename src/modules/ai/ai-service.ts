import type { AIExplanation, RiskRecord } from '@/modules/domain/types';
import { aiClient } from './ai-client';
import { createRiskExplanationPrompt } from './prompts';
import { validateAIExplanation } from './schema';
import { createLLMProvider } from './llm-provider';
import { chatWithAssistant as qwenChat } from './qwen-provider';
import type { AIChatRequest, AIChatResponse } from './types';

const recent = new Map<string, { value: AIExplanation; expiresAt: number }>();
const COOLDOWN_MS = 60_000;

/**
 * This service accepts only an existing risk-engine result. It never calls the
 * engine and cannot create a new risk record.
 */
export async function explainRisk(reportId: string, riskRecord: RiskRecord): Promise<AIExplanation> {
  const prompt = createRiskExplanationPrompt(riskRecord);
  const key = `${reportId}:${riskRecord.id}`;
  const cached = recent.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const request = { reportId, riskRecord, prompt };
  try {
    const rawExplanation = await aiClient.explainRisk(request);
    const value = validateAIExplanation(rawExplanation, reportId, riskRecord);
    recent.set(key, { value, expiresAt: Date.now() + COOLDOWN_MS });
    return value;
  } catch {
    const value = validateAIExplanation(await createLLMProvider('mock').explainRisk(request), reportId, riskRecord);
    recent.set(key, { value, expiresAt: Date.now() + COOLDOWN_MS });
    return value;
  }
}

/**
 * AI 助手问答：复用同一 Qwen 在线 provider，失败时直接抛错。
 * 不引入 mock 兜底，不生成替代风险分析。
 */
export async function chatWithAssistant(request: AIChatRequest): Promise<AIChatResponse> {
  return qwenChat(request);
}

export const AI_GENERATION_COOLDOWN_MS = COOLDOWN_MS;
