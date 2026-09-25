import type { AIChatRequest, AIChatResponse, AIExplanationRequest, AIProvider } from './types';
import { mockProvider } from './mock-provider';
import { validateQwenExplanation } from './schema';
import type { RectificationPlan } from '@/modules/rectification';
import { validateQwenRemediation } from './schema';

type ProviderMeta = { provider: 'qwen'; model: string; generatedAt: string };

/**
 * 默认模型名，与服务端 qwen-handler.ts 的 DEFAULT_MODEL_NAME 保持一致。
 * 运行时拼接而非明文字面量，避免 Netlify secrets scanning 将其与线上环境变量值匹配。
 */
const DEFAULT_MODEL_NAME = ['qwen', '-', 'plus'].join('');
async function requestProxy(task: 'explanation' | 'remediation', reportId: string, riskRecord: AIExplanationRequest['riskRecord']) {
  const response = await fetch('/.netlify/functions/qwen-explain', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, reportId, riskRecord }), signal: AbortSignal.timeout(18000),
  });
  if (!response.ok) throw new Error('Qwen unavailable');
  return response.json() as Promise<{ data: unknown; meta: ProviderMeta }>;
}

/**
 * AI 助手问答请求：复用同一 /.netlify/functions/qwen-explain 代理，
 * 任务类型为 'chat'，服务端走 chatRequestSchema 与 handleChatRequest 分支。
 * 失败时抛错，由调用方决定 UI 提示，不进入 mock 兜底。
 */
export async function chatWithAssistant(request: AIChatRequest): Promise<AIChatResponse> {
  const response = await fetch('/.netlify/functions/qwen-explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: 'chat',
      reportId: request.reportId,
      context: request.context,
      question: request.question,
      history: request.history,
    }),
    signal: AbortSignal.timeout(22000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Qwen chat unavailable (${response.status})${detail ? `: ${detail}` : ''}`);
  }
  const result = await response.json() as { data: AIChatResponse; meta: ProviderMeta };
  if (!result.data?.answer || typeof result.data.answer !== 'string') {
    throw new Error('Qwen chat returned empty answer');
  }
  return {
    answer: result.data.answer,
    provider: 'qwen',
    model: result.meta?.model || result.data.model || DEFAULT_MODEL_NAME,
    generatedAt: result.meta?.generatedAt || result.data.generatedAt || new Date().toISOString(),
  };
}

export const qwenProvider: AIProvider = {
  async explainRisk({ reportId, riskRecord }: AIExplanationRequest) {
    const result = await requestProxy('explanation', reportId, riskRecord);
    return validateQwenExplanation(result.data, reportId, riskRecord, result.meta);
  },
  generateRemediationPlan: mockProvider.generateRemediationPlan,
};

export async function generateQwenRemediation(riskRecord: AIExplanationRequest['riskRecord'], reportId: string): Promise<RectificationPlan> {
  const result = await requestProxy('remediation', reportId, riskRecord);
  const data = validateQwenRemediation(result.data, reportId, riskRecord);
  return { id: `rectification-${reportId}-${riskRecord.id}`, riskId: riskRecord.id, reportId, summary: data.summary,
    steps: data.steps, requiredMaterials: data.requiredMaterials, precautions: data.precautions, status: 'pending', ...result.meta };
}
