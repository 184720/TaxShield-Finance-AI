import type { EnterpriseProfile, TaxDataBundle } from './types';

// Fixed demo input, not a prescription for changing real financial records.
export function createRectifiedDemoData(): TaxDataBundle {
  const data = structuredClone(WUHAN_ZHICHUANG_DATA);
  data.declaration.declaredRevenue = data.financial.accountingRevenue;
  data.invoice.invoicedRevenue = data.financial.accountingRevenue;
  data.receivedAmount = data.financial.accountingRevenue;
  data.contractAmount = data.financial.accountingRevenue;
  data.financial.sellingExpenses = 250_000;
  data.financial.adminExpenses = 400_000;
  data.invoice.supplierConcentration = 0.4;
  data.invoice.redInvoiceAmount = 0;
  data.invoice.abnormalInvoiceAmount = 0;
  data.invoice.inputTax = data.invoice.outputTax - data.declaration.vatPayable;
  data.monthlyTrend[data.monthlyTrend.length - 1] = { month: '2026-06', revenue: 650_000, cost: 270_000, expenses: 200_000 };
  return data;
}

export const WUHAN_ZHICHUANG_PROFILE: EnterpriseProfile = {
  id: 'wuhan-zhichuang',
  name: '武汉智创科技有限公司',
  industry: 'software',
  region: '湖北省武汉市',
  taxpayerType: 'general',
  employeeCount: 35,
  annualRevenue: 8_000_000,
  foundedYear: 2020,
  mainTaxes: ['增值税', '企业所得税', '附加税费'],
  isHighTechEnterprise: false,
};

export const WUHAN_ZHICHUANG_DATA: TaxDataBundle = {
  financial: {
    accountingRevenue: 2_100_000,
    operatingCost: 840_000,
    sellingExpenses: 390_000,
    adminExpenses: 540_000,
    rAndDExpenses: 620_000,
    totalProfit: 330_000,
  },
  invoice: {
    invoicedRevenue: 2_060_000,
    outputTax: 267_800,
    inputTax: 115_000,
    supplierConcentration: 0.72,
    redInvoiceAmount: 12_000,
    abnormalInvoiceAmount: 48_000,
  },
  declaration: {
    declaredRevenue: 1_880_000,
    vatPayable: 142_000,
    corporateIncomeTaxPayable: 42_000,
  },
  receivedAmount: 2_035_000,
  contractAmount: 2_160_000,
  monthlyTrend: [
    { month: '2026-01', revenue: 510_000, cost: 212_000, expenses: 160_000 },
    { month: '2026-02', revenue: 540_000, cost: 228_000, expenses: 168_000 },
    { month: '2026-03', revenue: 565_000, cost: 236_000, expenses: 172_000 },
    { month: '2026-04', revenue: 590_000, cost: 242_000, expenses: 180_000 },
    { month: '2026-05', revenue: 610_000, cost: 246_000, expenses: 194_000 },
    { month: '2026-06', revenue: 1_080_000, cost: 252_000, expenses: 556_000 },
  ],
};
