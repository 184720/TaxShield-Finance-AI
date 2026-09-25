import type { RiskRecord } from '@/modules/domain/types';
import type { RectificationPlan } from '@/modules/rectification';
import { generateQwenRemediation } from './qwen-provider';

const recentPlans = new Map<string, { value: RectificationPlan; expiresAt: number }>();
const REMEDIATION_COOLDOWN_MS = 60_000;

type RemediationTemplate = Pick<RectificationPlan, 'summary' | 'steps' | 'requiredMaterials' | 'precautions'>;

// Fixed templates keep the demo deterministic and prevent the AI layer from re-judging a tax risk.
const REMEDIATION_TEMPLATES: Record<string, RemediationTemplate> = {
  'revenue-consistency': { summary: '目标：核实收入确认、开票与申报口径差异，并形成可追溯的核对记录。', steps: ['导出收入台账、开票明细和纳税申报表。', '逐笔核对收入确认时点、未开票收入和申报口径。', '对已确认差异形成说明并履行内部复核。'], requiredMaterials: ['收入台账', '发票明细', '纳税申报表', '银行流水'], precautions: ['不要仅按单一数据口径调整申报。', '涉及更正申报前应由专业人员复核。'] },
  vat: { summary: '目标：核验销项、进项与申报数据，确认抵扣链条完整性。', steps: ['核对销项发票与收入台账。', '筛选并复核进项发票用途和抵扣期间。', '比对申报表与账务税额后保留复核记录。'], requiredMaterials: ['销项发票清单', '进项发票清单', '增值税申报表'], precautions: ['不得以整改为由补造业务资料。', '抵扣事项应以申报期有效政策为准。'] },
  cit: { summary: '目标：复核成本费用的真实性、关联性与税前扣除凭证。', steps: ['筛选大额、异常和跨期成本费用。', '核对合同、发票、付款凭证及入账依据。', '形成费用归集与内部复核说明。'], requiredMaterials: ['费用明细账', '合同', '付款凭证', '合规扣除凭证'], precautions: ['避免将会计处理直接等同于税前扣除。', '涉税调整应由专业人员复核。'] },
  invoice: { summary: '目标：核验重点供应商和异常发票的真实业务链条。', steps: ['导出异常、红字发票和重点供应商清单。', '核验供应商资质、合同、验收与付款信息。', '记录异常原因及后续处理结论。'], requiredMaterials: ['发票明细', '供应商合同', '验收资料', '付款凭证'], precautions: ['不得修改或删除原始凭证。', '红字发票处理应符合适用规则。'] },
  industry: { summary: '目标：说明经营指标偏离行业基准的业务原因。', steps: ['复核收入、成本归集及毛利率计算口径。', '整理项目、客户或产品结构变化资料。', '形成行业偏离的业务说明并内部审批。'], requiredMaterials: ['项目合同', '成本归集表', '经营分析报告'], precautions: ['行业基准仅作风险提示，不能替代企业实际业务判断。', '说明应与原始经营资料一致。'] },
  benefit: { summary: '目标：评估研发费用优惠等事项是否具备申请或享受条件。', steps: ['梳理研发项目、人员工时和费用归集。', '核对研发辅助账与原始费用凭证。', '由专业人员评估资格及申报期资料。'], requiredMaterials: ['立项书', '研发辅助账', '工时记录', '费用凭证'], precautions: ['满足研发投入不代表当然具备优惠资格。', '不得追溯补造研发过程资料。'] },
  'three-flow': { summary: '目标：建立合同、资金、发票与申报的关联核验表。', steps: ['汇总合同、交付、开票、收款和申报记录。', '逐笔标注跨期、预收或差异事项。', '形成差异说明并完成内部复核。'], requiredMaterials: ['合同', '验收单', '发票', '银行流水', '申报表'], precautions: ['差异说明应基于真实交易和原始资料。', '涉及申报调整前应由专业人员复核。'] },
  trend: { summary: '目标：核实异常期间收入、成本和费用变动原因。', steps: ['提取异常月份的总账与业务台账。', '核对收入确认、成本结转和费用归集时间。', '形成经营波动说明并保留审批记录。'], requiredMaterials: ['月度总账', '项目验收单', '经营分析资料'], precautions: ['趋势异常不等同于违规结论。', '应结合业务周期和季节性因素说明。'] },
};

/** Generates a deterministic remediation plan from an existing RiskRecord only. */
export async function generateRemediationPlan(riskRecord: RiskRecord, reportId: string): Promise<RectificationPlan> {
  const key = `${reportId}:${riskRecord.id}`;
  const cached = recentPlans.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const value = await generateQwenRemediation(riskRecord, reportId);
    recentPlans.set(key, { value, expiresAt: Date.now() + REMEDIATION_COOLDOWN_MS });
    return value;
  } catch { /* offline/error/schema fallback */ }
  const template = REMEDIATION_TEMPLATES[riskRecord.id] ?? {
    summary: `目标：针对“${riskRecord.riskName}”完成资料核验与内部复核。`,
    steps: riskRecord.suggestion.steps,
    requiredMaterials: riskRecord.suggestion.requiredMaterials,
    precautions: riskRecord.suggestion.precautions,
  };
  const value: RectificationPlan = { id: `rectification-${reportId}-${riskRecord.id}`, riskId: riskRecord.id, reportId, ...template, status: 'pending', provider: 'mock', model: 'fixed-template-v1', generatedAt: new Date().toISOString() };
  recentPlans.set(key, { value, expiresAt: Date.now() + REMEDIATION_COOLDOWN_MS });
  return value;
}
