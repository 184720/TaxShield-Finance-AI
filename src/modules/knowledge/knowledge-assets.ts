import { RULE_GUIDE } from '../trust/trust-content';
import { POLICY_LIBRARY } from '../policy/policy-store';

const FIELDS: Record<string, string[]> = {
  'revenue-consistency': ['financial.accountingRevenue', 'declaration.declaredRevenue'],
  vat: ['financial.accountingRevenue', 'declaration.vatPayable', 'invoice.outputTax', 'invoice.inputTax'],
  cit: ['financial.accountingRevenue', 'financial.operatingCost', 'financial.sellingExpenses', 'financial.adminExpenses', 'financial.totalProfit'],
  invoice: ['invoice.supplierConcentration', 'invoice.redInvoiceAmount', 'invoice.abnormalInvoiceAmount'],
  industry: ['profile.industry', 'financial.accountingRevenue', 'financial.operatingCost'],
  benefit: ['financial.rAndDExpenses', 'profile.isHighTechEnterprise'],
  'three-flow': ['contractAmount', 'receivedAmount', 'declaration.declaredRevenue'],
  trend: ['monthlyTrend[].revenue', 'monthlyTrend[].cost', 'monthlyTrend[].expenses'],
};

// 只读说明资产，不执行规则；实际报告以原引擎输出为准。
export const KNOWLEDGE_ASSETS = RULE_GUIDE.map((rule) => ({
  ...rule, evidenceFields: FIELDS[rule.id],
  explanation: `用于发现“${rule.name}”相关的进一步核查事项，不直接认定违法或经营能力。`,
  remediationPath: ['核对数据期间、来源和原始凭证', rule.direction, '记录执行过程；仅在实际依据支持时修正输入，再运行复检'],
  policies: POLICY_LIBRARY.filter((policy) => policy.riskTypes.includes(rule.id)),
  limitations: '必要字段缺失时规则未执行；程序关注阈值和演示行业参考值不是监管标准。政策时效与适用性须专业复核。',
}));
