import type { RemediationPlan, RiskRecord } from '@/modules/domain/types';
import type { AIExplanationRequest, AIProvider } from './types';

const EXPLANATION_TEMPLATES: Record<string, { summary: string; reasonPrefix: string; confidence: number }> = {
  'revenue-consistency': { summary: '收入申报一致性风险解释', reasonPrefix: '该风险由风险引擎比对发票、会计、申报或收款口径后触发。', confidence: 0.9 },
  vat: { summary: '增值税风险解释', reasonPrefix: '该风险由风险引擎依据纳税人类型、销项、进项或抵扣相关数据触发。', confidence: 0.88 },
  cit: { summary: '企业所得税风险解释', reasonPrefix: '该风险由风险引擎结合收入、成本、费用和利润数据触发。', confidence: 0.88 },
  invoice: { summary: '发票风险解释', reasonPrefix: '该风险由风险引擎依据供应商集中度、红字或异常发票等数据触发。', confidence: 0.9 },
  industry: { summary: '行业偏离风险解释', reasonPrefix: '该风险由风险引擎将企业指标与所属行业基准进行比较后触发。', confidence: 0.86 },
  benefit: { summary: '税收优惠风险解释', reasonPrefix: '该风险由风险引擎检查企业画像与税收优惠适用条件后触发。', confidence: 0.84 },
  'three-flow': { summary: '三流一致性风险解释', reasonPrefix: '该风险由风险引擎比对业务、资金、发票和申报相关金额后触发。', confidence: 0.87 },
  trend: { summary: '趋势异常风险解释', reasonPrefix: '该风险由风险引擎分析多期收入、成本或费用变化后触发。', confidence: 0.85 },
};

function toExplanation(request: AIExplanationRequest) {
  const { reportId, riskRecord: risk } = request;
  const template = EXPLANATION_TEMPLATES[risk.id] ?? {
    summary: '税务风险解释',
    reasonPrefix: '该风险由风险引擎基于已输入数据触发。',
    confidence: 0.8,
  };

  return {
    riskId: risk.id,
    reportId,
    summary: template.summary,
    reasonAnalysis: `${template.reasonPrefix}${risk.reason}`,
    // Evidence is passed through unchanged so the mock never fabricates data.
    evidence: risk.evidence,
    impact: `风险引擎测算的预计影响金额为 ${Math.round(risk.impactAmount).toLocaleString('zh-CN')} 元。`,
    suggestion: risk.suggestion.steps,
    confidence: template.confidence,
    disclaimer: '本解释仅对风险引擎已输出的结论及证据进行辅助说明，不构成税务、法律或申报意见；请结合有效政策文件由专业人员复核。',
    provider: 'mock' as const,
    model: 'fixed-template-v1',
    generatedAt: new Date().toISOString(),
  };
}

export const mockProvider: AIProvider = {
  async explainRisk(request) { return toExplanation(request); },
  async generateRemediationPlan(risk: RiskRecord): Promise<RemediationPlan> { return risk.suggestion; },
};
