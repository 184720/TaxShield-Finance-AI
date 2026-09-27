import type { TaxHealthReport } from '../domain/types';
import type { BenchmarkMetricId, BenchmarkSnapshot, IndustryBenchmark } from './types';

const INDUSTRY_LABEL = { software: '软件信息服务', trade: '商贸流通', manufacturing: '制造业', catering: '餐饮服务' } as const;
const DEMO_RANGES: Record<keyof typeof INDUSTRY_LABEL, Record<BenchmarkMetricId, string>> = {
  software: { 'tax-burden': '演示区间：3%–6%', 'invoice-pattern': '演示观察：供应商集中度低于50%', 'revenue-trend': '演示观察：月度收入波动不高于30%', 'cost-structure': '演示观察：成本率40%–70%' },
  trade: { 'tax-burden': '演示区间：1%–4%', 'invoice-pattern': '演示观察：供应商集中度低于65%', 'revenue-trend': '演示观察：月度收入波动不高于35%', 'cost-structure': '演示观察：成本率65%–90%' },
  manufacturing: { 'tax-burden': '演示区间：2%–5%', 'invoice-pattern': '演示观察：供应商集中度低于60%', 'revenue-trend': '演示观察：月度收入波动不高于30%', 'cost-structure': '演示观察：成本率55%–85%' },
  catering: { 'tax-burden': '演示区间：2%–6%', 'invoice-pattern': '演示观察：供应商集中度低于55%', 'revenue-trend': '演示观察：月度收入波动不高于40%', 'cost-structure': '演示观察：成本率35%–65%' },
};
const LABELS: Record<BenchmarkMetricId, string> = { 'tax-burden': '税负水平', 'invoice-pattern': '发票情况', 'revenue-trend': '收入趋势', 'cost-structure': '成本结构' };

/** 本地模拟行业参考，不调用互联网，也不宣称为真实行业统计。 */
export function getIndustryBenchmark(industry: keyof typeof INDUSTRY_LABEL): IndustryBenchmark {
  return {
    industry, industryLabel: INDUSTRY_LABEL[industry], source: '本地模拟基准库（比赛演示）',
    items: (Object.keys(LABELS) as BenchmarkMetricId[]).map((id) => ({ id, label: `${LABELS[id]}（%）`, referenceLabel: '演示参考值', referenceText: `演示参考值 · ${DEMO_RANGES[industry][id]}`, note: '比例单位：%；收入趋势为最近两个月环比变化率的绝对值。仅用于演示，不参与风险判断。' })),
    disclaimer: '所有行业数据均为“演示参考值”，来自本地模拟基准库，不代表真实行业统计、监管标准或金融机构准入规则。',
  };
}

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
function currentMetric(report: TaxHealthReport, id: BenchmarkMetricId): { value: string; available: boolean } {
  const { financial, invoice, declaration } = report.inputSnapshot;
  const missing = { value: '数据不足（无法计算）', available: false };
  const valid = (value: number) => Number.isFinite(value) && value >= 0;
  const ratio = (label: string, numerator: number, denominator: number) => {
    const result = numerator / denominator;
    return valid(numerator) && valid(denominator) && denominator > 0 && Number.isFinite(result * 100)
      ? { value: `${label} ${percent(result)}`, available: true } : missing;
  };
  if (id === 'tax-burden') return ratio('应纳增值税 / 会计收入', declaration.vatPayable, financial.accountingRevenue);
  if (id === 'invoice-pattern') return valid(invoice.supplierConcentration) && invoice.supplierConcentration <= 1
    ? { value: `供应商集中度 ${percent(invoice.supplierConcentration)}`, available: true } : missing;
  if (id === 'cost-structure') return ratio('营业成本 / 会计收入', financial.operatingCost, financial.accountingRevenue);
  const trend = [...report.trend].sort((a, b) => a.month.localeCompare(b.month));
  if (report.inputSnapshot.availability?.monthlyTrend === false || trend.length < 2) return missing;
  const previous = trend[trend.length - 2];
  const last = trend[trend.length - 1];
  const monthIndex = (month: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) : NaN;
  if (monthIndex(last.month) - monthIndex(previous.month) !== 1 || !valid(last.revenue) || !valid(previous.revenue) || previous.revenue === 0) return missing;
  const change = (last.revenue - previous.revenue) / previous.revenue;
  if (!Number.isFinite(change * 100)) return missing;
  return { value: `${previous.month} → ${last.month}：环比 ${percent(change)}；波动幅度 ${percent(Math.abs(change))}`, available: true };
}

export function buildBenchmarkSnapshot(report: TaxHealthReport): BenchmarkSnapshot {
  const benchmark = getIndustryBenchmark(report.profile.industry);
  return {
    reportId: report.reportId, industryLabel: benchmark.industryLabel,
    items: benchmark.items.map((item) => {
      const current = currentMetric(report, item.id);
      return { ...item, currentValue: current.value, dataAvailable: current.available };
    }),
    disclaimer: benchmark.disclaimer,
  };
}
