import type { EnterpriseProfile, RiskRecord, RuleDataInsufficiency, TaxDataBundle } from '@/modules/domain/types';
import { POLICY_LIBRARY } from '@/modules/policy/policy-store';
import { INDUSTRY_BENCHMARKS } from './industryBenchmark';
import { evidence, money, percent } from './riskEvidence';
import { remediation } from './riskSuggestion';

export interface RiskRuleEvaluation {
  risks: RiskRecord[];
  dataInsufficiencies: RuleDataInsufficiency[];
}

const policy = (id: string) => POLICY_LIBRARY.filter((item) => item.id === id);
const riskLevel = (probability: number, severity: number): RiskRecord['level'] => probability * severity >= 0.55 ? 'high' : probability * severity >= 0.25 ? 'medium' : 'low';
const insufficiency = (ruleId: string, category: string, requiredFields: string[]): RuleDataInsufficiency => ({ ruleId, category, requiredFields, dataInsufficient: true });
const valid = (...values: number[]) => values.every((value) => Number.isFinite(value) && value >= 0);

export function evaluateRiskRules(profile: EnterpriseProfile, data: TaxDataBundle): RiskRuleEvaluation {
  const { financial, invoice, declaration, receivedAmount, contractAmount, monthlyTrend } = data;
  const benchmark = INDUSTRY_BENCHMARKS[profile.industry];
  const risks: RiskRecord[] = [];
  const dataInsufficiencies: RuleDataInsufficiency[] = [];
  const add = (record: Omit<RiskRecord, 'status'>) => risks.push({ ...record, status: 'detected' });

  if (valid(financial.accountingRevenue, declaration.declaredRevenue)) {
    const gap = Math.abs(financial.accountingRevenue - declaration.declaredRevenue);
    const rate = gap / Math.max(financial.accountingRevenue, 1);
    if (rate > 0.03) add({ id: 'revenue-consistency', category: '收入申报', riskName: '收入申报一致性差异', level: riskLevel(Math.min(0.95, rate * 3), 0.85), probability: Math.min(0.95, rate * 3), severity: 0.85, impactAmount: gap * 0.06, reason: '会计收入与纳税申报收入存在差异，需要核实未开票收入、确认时点与申报口径。', evidence: [evidence('会计收入', money(financial.accountingRevenue)), evidence('申报收入', money(declaration.declaredRevenue)), evidence('差异率', percent(rate), '关注阈值 3%')], policyReferences: policy('vat'), suggestion: remediation('逐笔核对收入台账与申报表。', ['比对开票、收款、合同和总账收入。', '确认未开票收入是否已按规定申报。'], ['发票明细', '申报表', '银行流水']) });
  } else dataInsufficiencies.push(insufficiency('revenue-consistency', '收入申报', ['会计收入', '申报收入']));

  if (valid(financial.accountingRevenue, invoice.outputTax, invoice.inputTax, declaration.vatPayable)) {
    const vatRate = declaration.vatPayable / Math.max(financial.accountingRevenue, 1);
    const abnormal = vatRate < benchmark.vatBurden[0] / 100 || vatRate > benchmark.vatBurden[1] / 100 || (profile.taxpayerType === 'general' && invoice.inputTax > invoice.outputTax * 0.85);
    if (abnormal) add({ id: 'vat', category: '增值税', riskName: '增值税负担与抵扣异常', level: 'medium', probability: 0.48, severity: 0.7, impactAmount: Math.abs(invoice.outputTax - invoice.inputTax - declaration.vatPayable), reason: '实际税负或进项抵扣比例偏离所属行业演示基准。', evidence: [evidence('实际税负', percent(vatRate), `${benchmark.vatBurden[0]}%–${benchmark.vatBurden[1]}%`), evidence('销项税额', money(invoice.outputTax)), evidence('进项税额', money(invoice.inputTax))], policyReferences: policy('vat'), suggestion: remediation('核验申报与抵扣链条。', ['核对销项发票与收入台账。', '检查进项发票、用途和抵扣期间。'], ['进项发票清单', '增值税申报表']) });
  } else dataInsufficiencies.push(insufficiency('vat', '增值税', ['会计收入', '销项税额', '进项税额', '应纳增值税']));

  if (valid(financial.accountingRevenue, financial.operatingCost, financial.sellingExpenses, financial.adminExpenses, financial.totalProfit)) {
    const grossMargin = (financial.accountingRevenue - financial.operatingCost) / Math.max(financial.accountingRevenue, 1) * 100;
    const expenseRatio = (financial.sellingExpenses + financial.adminExpenses) / Math.max(financial.accountingRevenue, 1) * 100;
    if (grossMargin < benchmark.grossMargin[0] || grossMargin > benchmark.grossMargin[1] || expenseRatio > benchmark.expenseRatio[1]) add({ id: 'cit', category: '企业所得税', riskName: '成本费用与利润结构异常', level: expenseRatio > benchmark.expenseRatio[1] + 8 ? 'high' : 'medium', probability: 0.62, severity: 0.74, impactAmount: Math.max(0, financial.sellingExpenses + financial.adminExpenses - financial.accountingRevenue * benchmark.expenseRatio[1] / 100) * 0.25, reason: '毛利率或期间费用率偏离行业基准，可能影响税前扣除的合理性。', evidence: [evidence('毛利率', `${grossMargin.toFixed(1)}%`), evidence('期间费用率', `${expenseRatio.toFixed(1)}%`, `不高于 ${benchmark.expenseRatio[1]}%`), evidence('利润总额', money(financial.totalProfit))], policyReferences: policy('cit'), suggestion: remediation('复核大额成本费用。', ['筛选大额、异常和跨期费用。', '核对合同、发票和付款证据。'], ['费用明细账', '合同', '付款凭证']) });
  } else dataInsufficiencies.push(insufficiency('cit', '企业所得税', ['营业收入', '营业成本', '销售费用', '管理费用', '利润总额']));

  if (valid(invoice.invoicedRevenue, invoice.supplierConcentration, invoice.redInvoiceAmount, invoice.abnormalInvoiceAmount)) {
    if (invoice.supplierConcentration >= 0.55 || invoice.redInvoiceAmount > 0 || invoice.abnormalInvoiceAmount > 0) add({ id: 'invoice', category: '发票管理', riskName: '供应商集中及发票异常', level: invoice.supplierConcentration >= 0.7 ? 'high' : 'medium', probability: invoice.supplierConcentration, severity: 0.68, impactAmount: invoice.abnormalInvoiceAmount + invoice.redInvoiceAmount, reason: '供应商集中度或异常、红字发票金额偏高，建议审查交易真实性及票据链条。', evidence: [evidence('最大供应商采购占比', percent(invoice.supplierConcentration), '关注阈值 55%'), evidence('异常发票金额', money(invoice.abnormalInvoiceAmount)), evidence('红字发票金额', money(invoice.redInvoiceAmount))], policyReferences: policy('invoice'), suggestion: remediation('建立供应商与发票核验台账。', ['核实重点供应商资质及合同。', '复核异常与红字发票原因。'], ['供应商合同', '发票明细', '付款凭证']) });
  } else dataInsufficiencies.push(insufficiency('invoice', '发票管理', ['开票金额', '供应商集中度', '红字发票金额']));

  if (valid(financial.accountingRevenue, financial.operatingCost)) {
    const grossMargin = (financial.accountingRevenue - financial.operatingCost) / Math.max(financial.accountingRevenue, 1) * 100;
    if (grossMargin < benchmark.grossMargin[0] || grossMargin > benchmark.grossMargin[1]) add({ id: 'industry', category: '行业偏离', riskName: '行业经营指标偏离', level: 'medium', probability: 0.45, severity: 0.55, impactAmount: financial.accountingRevenue * 0.015, reason: '企业毛利率偏离行业演示基准，需要结合业务结构说明。', evidence: [evidence('企业毛利率', `${grossMargin.toFixed(1)}%`), evidence('行业基准', `${benchmark.grossMargin[0]}%–${benchmark.grossMargin[1]}%`)], policyReferences: policy('cit'), suggestion: remediation('准备行业偏离的业务说明。', ['复核收入确认节点。', '说明成本结构变化。'], ['项目合同', '成本归集表']) });
  } else dataInsufficiencies.push(insufficiency('industry', '行业偏离', ['营业收入', '营业成本']));

  if (valid(financial.rAndDExpenses)) {
    const potentialSaving = profile.isHighTechEnterprise ? 0 : financial.rAndDExpenses * 0.5 * 0.25;
    if (financial.rAndDExpenses > 0 && !profile.isHighTechEnterprise) add({ id: 'benefit', category: '税收优惠', riskName: '研发费用优惠可能漏享', level: 'medium', probability: 0.58, severity: 0.52, impactAmount: potentialSaving, reason: '企业存在研发投入，需评估研发费用加计扣除等优惠资格。', evidence: [evidence('研发费用', money(financial.rAndDExpenses)), evidence('预计待评估优惠空间', money(potentialSaving))], policyReferences: policy('rnd'), suggestion: remediation('评估研发费用优惠适用条件。', ['梳理研发项目与人员工时。', '归集研发费用并核对辅助账。'], ['立项书', '研发辅助账', '费用凭证']) });
  } else dataInsufficiencies.push(insufficiency('benefit', '税收优惠', ['研发费用']));

  if (data.availability?.receivedAmount !== false && data.availability?.contractAmount !== false && valid(receivedAmount, contractAmount, declaration.declaredRevenue)) {
    const cashGap = Math.abs(receivedAmount - declaration.declaredRevenue);
    if (cashGap / Math.max(contractAmount, 1) > 0.05) add({ id: 'three-flow', category: '三流一致性', riskName: '合同、资金、发票、申报流不一致', level: 'high', probability: 0.7, severity: 0.8, impactAmount: cashGap * 0.06, reason: '合同金额、收款金额与申报收入存在需要解释的差异。', evidence: [evidence('合同金额', money(contractAmount)), evidence('收款金额', money(receivedAmount)), evidence('申报收入', money(declaration.declaredRevenue))], policyReferences: policy('vat'), suggestion: remediation('建立四流核验表。', ['关联合同、交付、开票、收款和申报。', '核查跨期收款与预收款。'], ['合同', '验收单', '发票', '银行流水']) });
  } else dataInsufficiencies.push(insufficiency('three-flow', '三流一致性', ['合同金额', '收款金额', '申报收入']));

  if (data.availability?.monthlyTrend !== false && monthlyTrend.length >= 2 && monthlyTrend.every((item) => valid(item.revenue, item.cost, item.expenses))) {
    const last = monthlyTrend[monthlyTrend.length - 1]; const previous = monthlyTrend[monthlyTrend.length - 2];
    const revenueGrowth = (last.revenue - previous.revenue) / Math.max(previous.revenue, 1);
    const costGrowth = (last.cost - previous.cost) / Math.max(previous.cost, 1);
    if (revenueGrowth > 0.35 && costGrowth < 0.12) add({ id: 'trend', category: '趋势异常', riskName: '收入成本趋势不匹配', level: 'medium', probability: 0.55, severity: 0.62, impactAmount: (last.revenue - previous.revenue) * 0.04, reason: '最近期间收入显著增长而成本未同步变化，需要核实确认与结转节奏。', evidence: [evidence('收入增长', percent(revenueGrowth)), evidence('成本增长', percent(costGrowth)), evidence('分析周期', `${monthlyTrend.length}个月`)], policyReferences: policy('cit'), suggestion: remediation('复核异常月份资料。', ['比对收入确认与成本结转时间。', '补充经营波动说明。'], ['月度总账', '项目验收单']) });
  } else dataInsufficiencies.push(insufficiency('trend', '趋势异常', ['至少两期收入、成本、费用数据']));

  return { risks, dataInsufficiencies };
}
