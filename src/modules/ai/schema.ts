import { z } from 'zod';
import type { AIExplanation, RiskRecord } from '@/modules/domain/types';
import { sanitizeAIExplanationText, sanitizeAITextForDisplay, UNSUPPORTED_NUMBER_MARKER } from './text-safety';

const RiskEvidenceSchema = z.object({
  label: z.string(),
  value: z.string(),
  comparison: z.string().optional(),
});

export const AIExplanationSchema = z.object({
  riskId: z.string().min(1),
  reportId: z.string().min(1),
  summary: z.string().min(1),
  reasonAnalysis: z.string().min(1),
  evidence: z.array(RiskEvidenceSchema),
  impact: z.string().min(1),
  suggestion: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(1),
  disclaimer: z.string().min(1),
  provider: z.enum(['qwen', 'mock']),
  model: z.string().min(1),
  generatedAt: z.string().datetime(),
});

export function validateAIExplanation(value: unknown, reportId: string, risk: RiskRecord): AIExplanation {
  const explanation = AIExplanationSchema.parse(value);
  if (explanation.riskId !== risk.id || explanation.reportId !== reportId) {
    throw new Error('AI explanation does not match its source risk record.');
  }

  // AI may describe the evidence, but the displayed evidence must be the exact engine output.
  if (JSON.stringify(explanation.evidence) !== JSON.stringify(risk.evidence)) {
    throw new Error('AI explanation includes evidence not present in the risk record.');
  }

  return sanitizeAIExplanationText(explanation);
}

const prose = z.string().trim().min(1).max(1800);
const numericTokenPattern = /[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:[eE][-+]?\d+)?/g;
// Citation shapes that must be backed by a supplied policy record.
const citationPattern = /[^\s，。；、：《》]*〔[^〕]*〕\s*\d*号|《[^》]*》|\[\d{4}\]|第[一二三四五六七八九十百\d]+[号条款]|(?:公告|通知|文件|政策编号)\s*[：:]\s*\S+/g;

function collectCanonicalNumbers(value: string): Set<string> {
  const numbers = new Set<string>();
  for (const token of value.match(numericTokenPattern) ?? []) {
    const parsed = Number(token.replaceAll(',', ''));
    if (Number.isFinite(parsed)) numbers.add(Object.is(parsed, -0) ? '0' : parsed.toString());
  }
  return numbers;
}

function redactUnsupportedNumbers(value: string, allowedNumbers: Set<string>): string {
  const redacted = value.replace(numericTokenPattern, (token) => {
    const parsed = Number(token.replaceAll(',', ''));
    const canonical = Object.is(parsed, -0) ? '0' : parsed.toString();
    return Number.isFinite(parsed) && allowedNumbers.has(canonical) ? token : UNSUPPORTED_NUMBER_MARKER;
  });
  return sanitizeAITextForDisplay(redacted);
}

/**
 * Replace citation-shaped text that is not backed by a supplied policy record
 * with a generic placeholder. A match is kept when it overlaps any known policy
 * literal (title, document number, article number, or id) — either the literal
 * is a substring of the match or the match is a substring of the literal. This
 * prevents fabricated citations from reaching the page while preserving valid
 * references and without rejecting an otherwise valid response.
 */
function redactUnsupportedCitations(value: string, risk: RiskRecord): string {
  const knownLiterals: string[] = [];
  for (const policy of risk.policyReferences) {
    for (const literal of [policy.documentNumber, policy.title, policy.articleNumber, policy.id]) {
      if (literal) knownLiterals.push(literal);
    }
  }
  return value.replace(citationPattern, (match) => {
    const supported = knownLiterals.some((literal) => match.includes(literal) || literal.includes(match));
    return supported ? match : '相关政策规定';
  });
}

/** Returns true when the text contains a citation shape not backed by a known policy literal. */
function hasUnsupportedCitations(value: string, risk: RiskRecord): boolean {
  const knownLiterals: string[] = [];
  for (const policy of risk.policyReferences) {
    for (const literal of [policy.documentNumber, policy.title, policy.articleNumber, policy.id]) {
      if (literal) knownLiterals.push(literal);
    }
  }
  for (const match of value.match(citationPattern) ?? []) {
    const supported = knownLiterals.some((literal) => match.includes(literal) || literal.includes(match));
    if (!supported) return true;
  }
  return false;
}
export const QwenExplanationSchema = z.object({
  riskId: z.string().min(1).max(120), reportId: z.string().min(1).max(160),
  risk_summary: prose, reason_analysis: prose, evidence_explanation: prose,
  possible_impact: prose, suggestion: prose,
  confidence: z.enum(['low', 'medium', 'high']), data_gaps: z.array(prose).max(10),
  evidence_indices: z.array(z.number().int().nonnegative()).min(1).max(100),
  policy_ids: z.array(z.string().min(1).max(120)).max(20),
}).strict();

/**
 * Redact numeric claims and policy citations that are not grounded in the
 * supplied evidence or policy records. The strict validator still runs
 * afterwards. This is the data returned to the client, so both number and
 * citation redaction must be applied here (validateQwenExplanation also
 * re-applies them as a defence-in-depth check, but its return value is an
 * AIExplanation, not the Qwen-shaped data sent over the wire).
 */
export function groundQwenExplanationNumbers(value: unknown, risk: RiskRecord) {
  const data = QwenExplanationSchema.parse(value);
  const allowedNumbers = collectCanonicalNumbers(JSON.stringify(risk.evidence) + JSON.stringify(risk.policyReferences));
  const redact = (text: string) => redactUnsupportedCitations(redactUnsupportedNumbers(text, allowedNumbers), risk);
  return {
    ...data,
    risk_summary: redact(data.risk_summary),
    reason_analysis: redact(data.reason_analysis),
    evidence_explanation: redact(data.evidence_explanation),
    possible_impact: redact(data.possible_impact),
    suggestion: redact(data.suggestion),
    data_gaps: data.data_gaps.map(redact),
  };
}

/** Reject unsafe output before adapting to the unchanged page/PDF contract. */
export function validateQwenExplanation(value: unknown, reportId: string, risk: RiskRecord, meta = { provider: 'qwen' as const, model: 'qwen', generatedAt: new Date().toISOString() }): AIExplanation {
  const parsed = QwenExplanationSchema.parse(value);
  if (parsed.riskId !== risk.id || parsed.reportId !== reportId) throw new Error('Mismatched source identifiers');
  if (parsed.evidence_indices.some((index) => index >= risk.evidence.length)) throw new Error('Unknown evidence');
  if (parsed.policy_ids.some((id) => !risk.policyReferences.some((policy) => policy.id === id))) throw new Error('Unknown policy');
  const policyText = JSON.stringify(risk.policyReferences);
  const allowedNumbers = collectCanonicalNumbers(JSON.stringify(risk.evidence) + policyText);
  // Re-ground numbers inside this validator as well. The upstream
  // groundQwenExplanationNumbers already redacts, but re-applying here guarantees
  // the prose only carries evidence/policy-backed numbers regardless of caller,
  // so fabricated figures never reach the page and the numeric check cannot
  // falsely reject a response.
  const data = {
    ...parsed,
    risk_summary: redactUnsupportedCitations(redactUnsupportedNumbers(parsed.risk_summary, allowedNumbers), risk),
    reason_analysis: redactUnsupportedCitations(redactUnsupportedNumbers(parsed.reason_analysis, allowedNumbers), risk),
    evidence_explanation: redactUnsupportedCitations(redactUnsupportedNumbers(parsed.evidence_explanation, allowedNumbers), risk),
    possible_impact: redactUnsupportedCitations(redactUnsupportedNumbers(parsed.possible_impact, allowedNumbers), risk),
    suggestion: redactUnsupportedCitations(redactUnsupportedNumbers(parsed.suggestion, allowedNumbers), risk),
    data_gaps: parsed.data_gaps.map((gap) => redactUnsupportedCitations(redactUnsupportedNumbers(gap, allowedNumbers), risk)),
  };
  const text = [data.risk_summary, data.reason_analysis, data.evidence_explanation, data.possible_impact, data.suggestion, ...data.data_gaps].join('\n');
  // Defensive: after redaction only supported citations should remain. Any
  // citation-shaped text not backed by a known policy literal is a leak.
  if (hasUnsupportedCitations(text, risk)) throw new Error('Unsupported policy citation');
  if (/违法|偷税|逃税|(?:风险等级|健康分|健康指数).{0,8}(?:改为|调整|提高|降低|变为)|新增.{0,6}风险|风险已解除|已解除风险|不存在风险/.test(text)) throw new Error('Model attempted a risk decision');
  // Defensive check: after re-grounding, every remaining number must be allowed.
  for (const number of collectCanonicalNumbers(text)) {
    if (!allowedNumbers.has(number)) throw new Error('Unsupported numeric evidence');
  }
  return validateAIExplanation({
    riskId: data.riskId, reportId: data.reportId, summary: data.risk_summary,
    reasonAnalysis: `${data.reason_analysis}\n证据解读：${data.evidence_explanation}`,
    evidence: risk.evidence.map((item) => ({ ...item })), impact: data.possible_impact,
    suggestion: [data.suggestion, ...data.data_gaps.map((gap) => `待核实：${gap}`)],
    confidence: { low: 0.3, medium: 0.5, high: 0.7 }[data.confidence],
    disclaimer: 'Qwen 大模型辅助解释；置信度仅为模型自评映射，不是准确率或风险概率。风险结论、等级和健康分由原规则引擎决定；政策适用性、解释与建议均需专业人员复核。',
    provider: meta.provider,
    model: meta.model,
    generatedAt: meta.generatedAt,
  }, reportId, risk);
}

export const QwenRemediationSchema = z.object({
  riskId: z.string().min(1).max(120), reportId: z.string().min(1).max(160), summary: prose,
  steps: z.array(prose).min(1).max(8), requiredMaterials: z.array(prose).min(1).max(12),
  precautions: z.array(prose).min(1).max(8), evidence_indices: z.array(z.number().int().nonnegative()).min(1).max(100),
  policy_ids: z.array(z.string().min(1).max(120)).max(20),
}).strict();

export function validateQwenRemediation(value: unknown, reportId: string, risk: RiskRecord) {
  const parsed = QwenRemediationSchema.parse(value);
  if (parsed.riskId !== risk.id || parsed.reportId !== reportId) throw new Error('Mismatched source identifiers');
  if (parsed.evidence_indices.some((index) => index >= risk.evidence.length)) throw new Error('Unknown evidence');
  if (parsed.policy_ids.some((id) => !risk.policyReferences.some((policy) => policy.id === id))) throw new Error('Unknown policy');
  const allowedNumbers = collectCanonicalNumbers(JSON.stringify(risk.evidence) + JSON.stringify(risk.policyReferences));
  // Ground numbers so remediation prose never carries fabricated figures.
  const data = {
    ...parsed,
    summary: redactUnsupportedCitations(redactUnsupportedNumbers(parsed.summary, allowedNumbers), risk),
    steps: parsed.steps.map((step) => redactUnsupportedCitations(redactUnsupportedNumbers(step, allowedNumbers), risk)),
    requiredMaterials: parsed.requiredMaterials.map((item) => redactUnsupportedCitations(redactUnsupportedNumbers(item, allowedNumbers), risk)),
    precautions: parsed.precautions.map((item) => redactUnsupportedCitations(redactUnsupportedNumbers(item, allowedNumbers), risk)),
  };
  const text = [data.summary, ...data.steps, ...data.requiredMaterials, ...data.precautions].join('\n');
  if (hasUnsupportedCitations(text, risk)) throw new Error('Unsupported policy citation');
  if (/违法|偷税|逃税|(?:风险等级|健康分|健康指数).{0,8}(?:改为|调整|提高|降低|变为)|风险已解除|已解除风险|不存在风险/.test(text)) throw new Error('Model attempted a risk decision');
  return data;
}
