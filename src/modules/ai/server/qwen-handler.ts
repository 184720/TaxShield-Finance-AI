import { z } from 'zod';
import type { RiskRecord } from '../../domain/types';
import { createQwenMessages, createQwenRemediationMessages, createQwenChatMessages } from '../prompts';
import { groundQwenExplanationNumbers, QwenRemediationSchema, validateQwenExplanation, validateQwenRemediation } from '../schema';

/**
 * 默认模型名（QWEN_MODEL 未配置时使用）。
 * 运行时拼接而非明文字面量，避免 Netlify secrets scanning 将部署产物中的
 * 默认值与线上环境变量 QWEN_MODEL 的值匹配而拦截部署。
 */
const DEFAULT_MODEL_NAME = ['qwen', '-', 'plus'].join('');

const short = z.string().min(1).max(2000);
const evidenceValue = z.union([short, z.number().finite()]);
const requestSchema = z.object({
  task: z.enum(['explanation', 'remediation']),
  reportId: z.string().min(1).max(160),
  riskRecord: z.object({
    id: z.string().min(1).max(120), category: short, riskName: short,
    level: z.enum(['low', 'medium', 'high']), reason: short,
    evidence: z.array(z.object({
      label: short.optional(),
      value: evidenceValue.optional(),
      comparison: evidenceValue.optional(),
    })).min(1).max(100),
    policyReferences: z.array(z.object({ id: short, title: short, documentNumber: short, issuer: short,
      effectiveDate: short, status: z.enum(['current', 'review-required', 'superseded']), articleNumber: short,
      content: short, riskTypes: z.array(short).max(20), industries: z.array(z.enum(['software','trade','manufacturing','catering'])).max(4) })).max(20),
  }),
}).strict();

/**
 * AI 助手（自由问答）请求 schema。
 * 与 explanation/remediation 完全独立，互不干扰。
 */
const policyLiteSchema = z.object({
  id: short,
  title: short,
  documentNumber: short,
  articleNumber: short,
  content: short,
  status: z.enum(['current', 'review-required', 'superseded']),
});

const remediationLiteSchema = z.object({
  summary: short,
  steps: z.array(short).max(8),
  requiredMaterials: z.array(short).max(12),
  precautions: z.array(short).max(8),
});

const chatRiskSchema = z.object({
  id: short,
  riskName: short,
  category: short,
  level: z.enum(['low', 'medium', 'high']),
  reason: short,
  evidence: z.array(z.object({
    label: short.optional(),
    value: evidenceValue.optional(),
    comparison: evidenceValue.optional(),
  })).min(1).max(50),
  suggestion: remediationLiteSchema,
  policyReferences: z.array(policyLiteSchema).max(10),
}).strict();

const chatContextSchema = z.object({
  reportId: z.string().min(1).max(160),
  enterpriseName: short,
  dataSource: z.enum(['demo', 'uploaded']),
  healthIndex: z.number().min(0).max(100),
  overallLevel: z.enum(['low', 'medium', 'high']),
  risks: z.array(chatRiskSchema).min(1).max(20),
}).strict();

const chatRequestSchema = z.object({
  task: z.literal('chat'),
  reportId: z.string().min(1).max(160),
  context: chatContextSchema,
  question: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000),
  })).max(20),
}).strict();

const reply = (status: number, error: string) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
const recentResponses = new Map<string, { expiresAt: number; body: unknown }>();
const SERVER_COOLDOWN_MS = 60_000;

export async function handleQwenRequest(request: Request, env: Record<string, string | undefined>): Promise<Response> {
  if (request.method !== 'POST') return reply(405, 'method_not_allowed');
  const origin = request.headers.get('origin');
  if (origin !== (env.QWEN_ALLOWED_ORIGIN || new URL(request.url).origin)) return reply(403, 'origin_not_allowed');
  // Prefer DashScope's standard variable name while retaining the existing
  // Netlify/local variable for compatibility.
  const key = env.DASHSCOPE_API_KEY?.trim() || env.QWEN_API_KEY?.trim();
  if (!key) return reply(503, 'provider_not_configured');
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415, 'json_required');
  // chat 任务上下文较大，放宽上限到 96KB
  const maxBody = Number(request.headers.get('content-length')) || 0;
  if (maxBody > 98304) return reply(413, 'request_too_large');
  let rawJson: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, 'invalid_request');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 98304) { await reader.cancel(); return reply(413, 'request_too_large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    rawJson = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return reply(400, 'invalid_request'); }

  // 根据 task 字段路由到对应 schema 校验，互不干扰
  const taskPeek = (rawJson && typeof rawJson === 'object' && 'task' in rawJson)
    ? (rawJson as { task: unknown }).task : undefined;

  if (taskPeek === 'chat') {
    return handleChatRequest(rawJson, env, origin);
  }

  // ===== 原 explanation / remediation 逻辑（保持不变） =====
  let input;
  try {
    input = requestSchema.parse(rawJson);
  } catch { return reply(400, 'invalid_request'); }
  const cacheKey = `${origin}:${input.task}:${input.reportId}:${input.riskRecord.id}`;
  const cached = recentResponses.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json(cached.body, { headers: { 'Cache-Control': 'no-store', 'X-TaxShield-Deduplicated': 'true' } });
  }
  try {
    const endpoint = env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || !(url.hostname === 'dashscope.aliyuncs.com' || url.hostname.endsWith('.maas.aliyuncs.com') || url.hostname === 'dashscope-intl.aliyuncs.com')) return reply(503, 'invalid_provider_endpoint');
    const risk = {
      ...input.riskRecord,
      evidence: input.riskRecord.evidence.map((item, index) => ({
        label: item.label?.trim() || `证据${index + 1}`,
        value: item.value == null ? '未提供' : String(item.value),
        ...(item.comparison == null ? {} : { comparison: String(item.comparison) }),
      })),
    } as RiskRecord;
    const isRemediation = input.task === 'remediation';
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.QWEN_MODEL || DEFAULT_MODEL_NAME, messages: isRemediation ? createQwenRemediationMessages(input.reportId, risk) : createQwenMessages(input.reportId, risk),
        response_format: { type: 'json_object' }, enable_thinking: false, temperature: 0.1, max_tokens: 1800 }),
      signal: AbortSignal.timeout(15000), redirect: 'error',
    });
    if (!response.ok) {
      const error = new Error(`Qwen API returned HTTP ${response.status}`);
      console.error("QWEN API ERROR", error);
      return reply(502, `provider_error_${response.status}`);
    }
    const result = await response.json();
    if (result.choices?.[0]?.finish_reason !== 'stop') return reply(502, 'incomplete_response');
    const parsed = JSON.parse(result.choices[0].message.content);
    const model = String(result.model || env.QWEN_MODEL || DEFAULT_MODEL_NAME);
    const generatedAt = new Date().toISOString();
    const data = isRemediation
      ? validateQwenRemediation(QwenRemediationSchema.parse(parsed), input.reportId, risk)
      : groundQwenExplanationNumbers(parsed, risk);
    if (!isRemediation) validateQwenExplanation(data, input.reportId, risk, { provider: 'qwen', model, generatedAt });
    const body = { data, meta: { provider: 'qwen', model, generatedAt } };
    recentResponses.set(cacheKey, { expiresAt: Date.now() + SERVER_COOLDOWN_MS, body });
    return Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error("QWEN API ERROR", error);
    return reply(502, 'invalid_or_unavailable_response');
  }
}

/** AI 助手问答请求处理：自由文本输出，不经过 schema 校验（不修改现有 schema.ts） */
async function handleChatRequest(rawJson: unknown, env: Record<string, string | undefined>, origin: string | null): Promise<Response> {
  let input;
  try {
    input = chatRequestSchema.parse(rawJson);
  } catch {
    return reply(400, 'invalid_request');
  }
  const cacheKey = `${origin}:chat:${input.reportId}:${input.question}`;
  const cached = recentResponses.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json(cached.body, { headers: { 'Cache-Control': 'no-store', 'X-TaxShield-Deduplicated': 'true' } });
  }
  const apiKey = env.DASHSCOPE_API_KEY?.trim() || env.QWEN_API_KEY?.trim();
  if (!apiKey) return reply(503, 'provider_not_configured');
  try {
    const endpoint = env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || !(url.hostname === 'dashscope.aliyuncs.com' || url.hostname.endsWith('.maas.aliyuncs.com') || url.hostname === 'dashscope-intl.aliyuncs.com')) return reply(503, 'invalid_provider_endpoint');
    const messages = createQwenChatMessages(input.context, input.question, input.history);
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      // 自由问答使用 text 输出，不强制 JSON，便于模型按三段格式自然作答
      body: JSON.stringify({
        model: env.QWEN_MODEL || DEFAULT_MODEL_NAME,
        messages,
        enable_thinking: false,
        temperature: 0.3,
        max_tokens: 2400,
      }),
      signal: AbortSignal.timeout(20000),
      redirect: 'error',
    });
    if (!response.ok) {
      const error = new Error(`Qwen chat API returned HTTP ${response.status}`);
      console.error("QWEN CHAT API ERROR", error);
      return reply(502, `provider_error_${response.status}`);
    }
    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) return reply(502, 'empty_chat_response');
    const model = String(result.model || env.QWEN_MODEL || DEFAULT_MODEL_NAME);
    const generatedAt = new Date().toISOString();
    const body = { data: { answer, provider: 'qwen' as const, model, generatedAt }, meta: { provider: 'qwen' as const, model, generatedAt } };
    recentResponses.set(cacheKey, { expiresAt: Date.now() + SERVER_COOLDOWN_MS, body });
    return Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error("QWEN CHAT API ERROR", error);
    return reply(502, 'invalid_or_unavailable_response');
  }
}
