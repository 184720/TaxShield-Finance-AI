import type { FinancialData, InvoiceData, MonthlyTrendData, TaxDataBundle, TaxDeclarationData, UploadPreview } from '@/modules/domain/types';

type CellValue = string | number | null | undefined;

const numberOf = (value: CellValue) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? '').replace(/[￥¥,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const columnValues = (preview: UploadPreview, field: string): CellValue[] => {
  const header = preview.mapping[field];
  return header ? preview.sourceRows.map((row) => row[header]) : [];
};

const sum = (values: CellValue[]) => values.reduce<number>((total, value) => total + numberOf(value), 0);

const requireMapped = (preview: UploadPreview, fields: string[]) => fields.every((field) => Boolean(preview.mapping[field]));

export function mapFinancial(preview: UploadPreview): FinancialData | null {
  const required = ['accountingRevenue', 'operatingCost', 'sellingExpenses', 'adminExpenses', 'rAndDExpenses', 'totalProfit'];
  if (!requireMapped(preview, required)) return null;
  return {
    accountingRevenue: sum(columnValues(preview, 'accountingRevenue')),
    operatingCost: sum(columnValues(preview, 'operatingCost')),
    sellingExpenses: sum(columnValues(preview, 'sellingExpenses')),
    adminExpenses: sum(columnValues(preview, 'adminExpenses')),
    rAndDExpenses: sum(columnValues(preview, 'rAndDExpenses')),
    totalProfit: sum(columnValues(preview, 'totalProfit')),
  };
}

export function mapInvoice(preview: UploadPreview): InvoiceData | null {
  if (!requireMapped(preview, ['amount', 'tax', 'counterparty'])) return null;
  const amountHeader = preview.mapping.amount;
  const counterpartyHeader = preview.mapping.counterparty;
  const redHeader = preview.mapping.redFlag;
  const supplierAmounts = new Map<string, number>();
  let redInvoiceAmount = 0;
  preview.sourceRows.forEach((row) => {
    const amount = numberOf(row[amountHeader]);
    const counterparty = String(row[counterpartyHeader] ?? '未标注交易方').trim() || '未标注交易方';
    supplierAmounts.set(counterparty, (supplierAmounts.get(counterparty) ?? 0) + amount);
    if (redHeader && /红|负/.test(String(row[redHeader] ?? ''))) redInvoiceAmount += amount;
  });
  const invoicedRevenue = sum(columnValues(preview, 'amount'));
  const largestSupplierAmount = Math.max(0, ...supplierAmounts.values());
  return {
    invoicedRevenue,
    outputTax: sum(columnValues(preview, 'tax')),
    inputTax: 0,
    supplierConcentration: invoicedRevenue > 0 ? largestSupplierAmount / invoicedRevenue : 0,
    redInvoiceAmount,
    abnormalInvoiceAmount: 0,
  };
}

export function mapDeclaration(preview: UploadPreview): TaxDeclarationData | null {
  if (!requireMapped(preview, ['declaredRevenue', 'vatPayable', 'corporateIncomeTaxPayable'])) return null;
  return {
    declaredRevenue: sum(columnValues(preview, 'declaredRevenue')),
    vatPayable: sum(columnValues(preview, 'vatPayable')),
    corporateIncomeTaxPayable: sum(columnValues(preview, 'corporateIncomeTaxPayable')),
  };
}

export function mapMonthlyTrend(preview: UploadPreview): MonthlyTrendData[] {
  const monthHeader = preview.mapping.month;
  if (!monthHeader || !preview.mapping.accountingRevenue) return [];
  const grouped = new Map<string, MonthlyTrendData>();
  preview.sourceRows.forEach((row) => {
    const month = String(row[monthHeader] ?? '').trim();
    if (!month) return;
    const entry = grouped.get(month) ?? { month, revenue: 0, cost: 0, expenses: 0 };
    entry.revenue += numberOf(row[preview.mapping.accountingRevenue]);
    entry.cost += numberOf(row[preview.mapping.operatingCost]);
    entry.expenses += numberOf(row[preview.mapping.sellingExpenses]) + numberOf(row[preview.mapping.adminExpenses]);
    grouped.set(month, entry);
  });
  return Array.from(grouped.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export interface TaxDataBuildResult {
  data?: TaxDataBundle;
  missing: string[];
}

export function buildTaxDataBundle(previews: { financial?: UploadPreview; invoice?: UploadPreview; declaration?: UploadPreview }): TaxDataBuildResult {
  const missing: string[] = [];
  const financial = previews.financial && mapFinancial(previews.financial);
  const invoice = previews.invoice && mapInvoice(previews.invoice);
  const declaration = previews.declaration && mapDeclaration(previews.declaration);
  if (!financial) missing.push('财务报表必填字段');
  if (!invoice) missing.push('发票明细必填字段');
  if (!declaration) missing.push('纳税申报数据必填字段');
  if (!financial || !invoice || !declaration) return { missing };
  return {
    missing,
    data: {
      financial,
      invoice,
      declaration,
      receivedAmount: financial.accountingRevenue,
      contractAmount: financial.accountingRevenue,
      monthlyTrend: previews.financial ? mapMonthlyTrend(previews.financial) : [],
      availability: { receivedAmount: false, contractAmount: false, monthlyTrend: Boolean(previews.financial?.mapping.month) },
    },
  };
}
