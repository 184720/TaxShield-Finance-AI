import type { EnterpriseProfile, TaxHealthReport } from '../domain/types';
import type { FinancingMaterialItem, FinancingMaterialSelections } from './types';

export const SELF_CHECK_MATERIALS = [
  { id: 'license', label: '营业执照信息', category: '企业基础资料' },
  { id: 'statements', label: '近期财务报表', category: '财务资料' },
  { id: 'tax-certificate', label: '近期纳税证明', category: '纳税资料' },
  { id: 'contracts', label: '主要业务合同', category: '经营资料' },
  { id: 'bank-statements', label: '银行流水', category: '经营资料' },
  { id: 'counterparties', label: '主要客户 / 供应商资料', category: '经营资料' },
  { id: 'funding-purpose', label: '融资用途与资料自查说明', category: '融资辅助资料' },
] as const;

export function isProfileComplete(profile: EnterpriseProfile): boolean {
  return Boolean(profile.id?.trim() && profile.name?.trim() && profile.region?.trim()
    && profile.industry && profile.taxpayerType && profile.mainTaxes?.length
    && Number.isFinite(profile.employeeCount) && profile.employeeCount >= 0
    && Number.isFinite(profile.annualRevenue) && profile.annualRevenue >= 0
    && Number.isFinite(profile.foundedYear) && profile.foundedYear > 0);
}
const hasNumbers = (value: object | undefined, fields: string[]) =>
  Boolean(value && fields.every((field) => {
    const number = (value as Record<string, unknown>)[field];
    return typeof number === 'number' && Number.isFinite(number);
  }));

export function buildFinancingMaterials(
  report: TaxHealthReport,
  selections: FinancingMaterialSelections = {},
): FinancingMaterialItem[] {
  const input = report.inputSnapshot;
  const dataNote = report.dataSource === 'demo'
    ? '来自内置模拟检测数据，不代表真实凭证已提交。'
    : '来自本次检测数据快照，仅表示字段齐全，不等同于原始凭证核验。';
  const automatic: FinancingMaterialItem[] = [
    { id: 'profile', label: '企业基本信息', category: '企业基础资料', status: isProfileComplete(report.profile) ? 'ready' : 'missing', source: 'report', note: '来自本次报告企业画像，未核验工商登记资料。' },
    { id: 'financial-data', label: '收入、成本及费用数据', category: '财务资料', status: hasNumbers(input?.financial, ['accountingRevenue', 'operatingCost', 'sellingExpenses', 'adminExpenses', 'rAndDExpenses', 'totalProfit']) ? 'ready' : 'missing', source: 'report', note: dataNote },
    { id: 'invoice-data', label: '发票检测数据', category: '纳税资料', status: hasNumbers(input?.invoice, ['invoicedRevenue', 'outputTax', 'inputTax', 'supplierConcentration', 'redInvoiceAmount', 'abnormalInvoiceAmount']) ? 'ready' : 'missing', source: 'report', note: dataNote },
    { id: 'declaration-data', label: '纳税申报检测数据', category: '纳税资料', status: hasNumbers(input?.declaration, ['declaredRevenue', 'vatPayable', 'corporateIncomeTaxPayable']) ? 'ready' : 'missing', source: 'report', note: dataNote },
  ];
  return [...automatic, ...SELF_CHECK_MATERIALS.map((item): FinancingMaterialItem => ({
    ...item, status: selections[item.id] ?? 'missing', source: 'self-check',
    note: report.dataSource === 'demo'
      ? '演示资料自查状态，仅模拟准备流程；本系统未接收或验证真实文件。'
      : '企业自行确认，资料保存在企业侧；本系统未接收或验证此文件。',
  }))];
}

