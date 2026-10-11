import { read, utils } from 'xlsx';
import type { ParsedUpload, UploadKind } from './types';

const aliases: Record<UploadKind, Record<string, string[]>> = {
  financial: { accountingRevenue: ['营业收入', '收入', '主营业务收入'], operatingCost: ['营业成本', '成本'], sellingExpenses: ['销售费用'], adminExpenses: ['管理费用'], rAndDExpenses: ['研发费用'], totalProfit: ['利润总额', '利润'], month: ['月份', '期间'] },
  invoice: { invoiceDate: ['发票日期', '开票日期'], invoiceNumber: ['发票号码', '号码'], counterparty: ['购销方名称', '供应商', '客户名称'], amount: ['金额', '不含税金额', '销售金额'], tax: ['税额', '销项税额'], invoiceType: ['发票类型'], redFlag: ['红字标识', '红字'], inputTax: ['进项税额'], abnormalInvoiceAmount: ['异常发票金额'] },
  declaration: { period: ['申报期间', '所属期'], declaredRevenue: ['申报收入', '销售额'], vatPayable: ['应纳增值税', '应纳税额'], corporateIncomeTaxPayable: ['应纳企业所得税', '所得税'] },
};

export const UPLOAD_FIELDS: Record<UploadKind, string[]> = {
  financial: ['accountingRevenue', 'operatingCost', 'sellingExpenses', 'adminExpenses', 'rAndDExpenses', 'totalProfit', 'month'],
  invoice: ['amount', 'tax', 'counterparty', 'redFlag', 'inputTax', 'abnormalInvoiceAmount'],
  declaration: ['declaredRevenue', 'vatPayable', 'corporateIncomeTaxPayable'],
};

const normal = (value: string) => value.replace(/[\s_\-]/g, '').toLowerCase();

export async function parseSpreadsheet(file: File, kind: UploadKind): Promise<ParsedUpload> {
  const data = await file.arrayBuffer();
  const workbook = read(data, { type: 'array', ...(file.name.toLowerCase().endsWith('.csv') ? { codepage: 65001 } : {}) });
  const sheetName = workbook.SheetNames[0] ?? 'Sheet1';
  const sheet = workbook.Sheets[sheetName];
  const sourceRows = utils.sheet_to_json<Record<string, string | number | null>>(sheet, { defval: null });
  if (sourceRows.length > 5_000) throw new Error('文件超过5000行，请按同一期间拆分后核验；系统不会截断数据后生成报告。');
  const headers = sourceRows.length ? Object.keys(sourceRows[0]) : [];
  const mapping: Record<string, string> = {};
  Object.entries(aliases[kind]).forEach(([field, names]) => { const matched = headers.find((header) => names.some((name) => normal(header) === normal(name))); if (matched) mapping[field] = matched; });
  const missingFields = Object.keys(aliases[kind]).filter((field) => !mapping[field] && field !== 'month' && field !== 'redFlag');
  return { id: `${kind}-${Date.now()}`, kind, fileName: file.name, sheetName, headers, rows: sourceRows.slice(0, 5), sourceRows, mapping, missingFields, rowCount: sourceRows.length };
}
