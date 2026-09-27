import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ArrowRight, CalendarClock, TrendingDown, TrendingUp, Activity, ShieldAlert, FileBarChart } from 'lucide-react';
import { PageTitle, RiskBadge, SectionCard, formatMoney, scoreTone } from '@/components/TaxShieldPrimitives';
import { loadHistory, loadReports, selectReport, subscribeReports } from '@/lib/taxshield-store';
import { compareReports } from '@/modules/report/report-diff';
import type { AssessmentHistoryItem, TaxHealthReport } from '@/modules/domain/types';

const signed = (n: number) => (n > 0 ? '+' + n : String(n));

interface TrendPoint {
  reportId: string;
  label: string;
  date: string;
  healthIndex: number;
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  impactAmount: number;
  isRecheck: boolean;
}

/** 从报告列表提取趋势点，按时间升序 */
function buildTrend(reports: TaxHealthReport[]): TrendPoint[] {
  return [...reports]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((r, i) => ({
      reportId: r.reportId,
      label: `第${i + 1}次`,
      date: new Date(r.createdAt).toLocaleDateString('zh-CN'),
      healthIndex: r.healthIndex,
      totalRisks: r.risks.length,
      highRisks: r.risks.filter((x) => x.level === 'high').length,
      mediumRisks: r.risks.filter((x) => x.level === 'medium').length,
      lowRisks: r.risks.filter((x) => x.level === 'low').length,
      impactAmount: r.totalImpactAmount,
      isRecheck: !!r.recheckOfReportId,
    }));
}

/** 把旧版 history 摘要也映射成趋势点（只有健康分和风险数） */
function legacyToTrend(legacy: AssessmentHistoryItem[]): TrendPoint[] {
  return [...legacy]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((item, i) => ({
      reportId: item.reportId,
      label: `历史${i + 1}`,
      date: new Date(item.createdAt).toLocaleDateString('zh-CN'),
      healthIndex: item.healthIndex,
      totalRisks: item.riskCount,
      highRisks: item.highRiskCount ?? 0,
      mediumRisks: Math.max(0, item.riskCount - (item.highRiskCount ?? 0)),
      lowRisks: 0,
      impactAmount: item.totalImpactAmount ?? 0,
      isRecheck: false,
    }));
}

function readHistoryPageData() {
  const reports = loadReports().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const legacy = loadHistory().filter((item) => !reports.some((report) => report.reportId === item.reportId));
  return { reports, legacy };
}

function Comparison({ previous, current }: { previous: TaxHealthReport; current: TaxHealthReport }) {
  const diff = compareReports(previous, current);
  const name = (id: string) => current.risks.find((r) => r.id === id)?.riskName ?? previous.risks.find((r) => r.id === id)?.riskName ?? id;
  const metrics = [
    ['健康分', diff.healthIndexBefore, diff.healthIndexAfter],
    ['风险数量', diff.riskCountBefore, diff.riskCountAfter],
    ['高风险数量', diff.highRiskCountBefore, diff.highRiskCountAfter],
    ['潜在影响金额', diff.impactAmountBefore, diff.impactAmountAfter],
  ] as const;

  const deltaTone = diff.healthIndexDelta >= 0 ? 'text-status-ok' : diff.healthIndexDelta > -10 ? 'text-status-warn' : 'text-status-risk';
  const riskDelta = diff.riskCountAfter - diff.riskCountBefore;

  return (
    <section className="mt-5 rounded-2xl border border-status-ok-line bg-status-ok-soft/30 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
        <TrendingUp className="size-4 text-status-ok" />
        整改前后变化对比
      </h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs text-slate-500">整改前</p>
          <p className="ts-tabular mt-1.5 text-3xl font-bold text-slate-400">{diff.healthIndexBefore}</p>
          <p className="mt-1 text-[11px] text-slate-400">{diff.riskCountBefore} 项风险 · {formatMoney(diff.impactAmountBefore)}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 text-slate-300">
          {diff.healthIndexDelta >= 0 ? <TrendingUp className="size-6 text-status-ok" /> : <TrendingDown className="size-6 text-status-risk" />}
          <span className={`ts-tabular text-lg font-bold ${deltaTone}`}>{signed(diff.healthIndexDelta)}</span>
          <span className="text-[10px] text-slate-400">健康分变化</span>
        </div>
        <div className="rounded-xl border border-status-ok-line bg-status-ok-soft p-4 text-center">
          <p className="text-xs text-slate-500">整改后</p>
          <p className="ts-tabular mt-1.5 text-3xl font-bold text-status-ok">{diff.healthIndexAfter}</p>
          <p className="mt-1 text-[11px] text-slate-500">{diff.riskCountAfter} 项风险 · {formatMoney(diff.impactAmountAfter)}</p>
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-slate-600">
        健康分 <span className={deltaTone}>{signed(diff.healthIndexDelta)}</span>，
        风险数量 <span className={riskDelta <= 0 ? 'text-status-ok' : 'text-status-risk'}>{signed(riskDelta)}</span>
      </p>

      {current.engineVersion !== previous.engineVersion && (
        <p className="mt-2 text-xs text-slate-500">两次检测引擎版本不同，请结合规则变更理解差异。</p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="py-2 font-medium">指标</th><th className="py-2 font-medium">整改前</th><th className="py-2 font-medium">整改后</th><th className="py-2 font-medium">变化</th></tr></thead>
          <tbody>
            {metrics.map(([label, before, after]) => (
              <tr key={label} className="border-b border-slate-100">
                <td className="py-2 text-slate-600">{label}</td>
                <td className="py-2">{label === '潜在影响金额' ? formatMoney(before) : before.toLocaleString('zh-CN')}</td>
                <td className="py-2">{label === '潜在影响金额' ? formatMoney(after) : after.toLocaleString('zh-CN')}</td>
                <td className={`py-2 font-medium ${after - before >= 0 ? 'text-status-risk' : 'text-status-ok'}`}>
                  {label === '潜在影响金额' ? signed(Number((after - before).toFixed(0))) : signed(Number((after - before).toFixed(2)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {([
          ['已解除风险', diff.resolvedRiskIds, 'text-status-ok'],
          ['仍存在风险', diff.remainingRiskIds, 'text-status-warn'],
          ['新增风险', diff.newRiskIds, 'text-status-risk'],
        ] as const).map(([label, ids, tone]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3.5">
            <h4 className={`flex items-center justify-between font-semibold ${tone}`}>
              {label}
              <span className="ts-tabular text-xs text-slate-400">{ids.length} 项</span>
            </h4>
            <ul className="mt-2 space-y-1.5 text-sm">
              {ids.length ? ids.map((id) => (
                <li key={id} className="text-slate-600">
                  {name(id)}
                  {label === '仍存在风险' && previous.remediationStatus?.[id] === 'completed' && (
                    <span className="ml-1 text-amber-700">（整改已执行但仍存在）</span>
                  )}
                </li>
              )) : <li className="text-slate-400">无</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState(readHistoryPageData);
  const { reports, legacy } = historyData;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => subscribeReports(() => setHistoryData(readHistoryPageData())), []);

  // 合并完整报告 + 旧版摘要，按时间升序生成趋势
  const trend = useMemo<TrendPoint[]>(() => {
    const full = buildTrend(reports);
    const old = legacyToTrend(legacy);
    return [...old, ...full].sort((a, b) => a.date.localeCompare(b.date));
  }, [reports, legacy]);

  // 健康指数趋势图
  const healthTrendOption = useMemo<EChartsOption>(() => {
    if (trend.length < 2) {
      return {} as EChartsOption;
    }
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: trend.map((p) => p.label), axisLabel: { color: '#94a3b8', fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', min: 0, max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
      series: [{
        name: '健康指数', type: 'line', smooth: true, symbol: 'circle', symbolSize: 8,
        lineStyle: { color: '#1a365d', width: 3 },
        itemStyle: { color: '#1a365d' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(26,54,93,0.2)' }, { offset: 1, color: 'rgba(26,54,93,0.02)' }] } },
        data: trend.map((p) => p.healthIndex),
        markPoint: {
          data: [
            { type: 'max', name: '最高', label: { color: '#16a34a' } },
            { type: 'min', name: '最低', label: { color: '#dc2626' } },
          ],
        },
      }],
    };
  }, [trend]);

  // 风险数量变化对比图（高/中/低堆叠柱）
  const riskTrendOption = useMemo<EChartsOption>(() => {
    if (trend.length < 2) return {} as EChartsOption;
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['高风险', '中风险', '低风险'], bottom: 0, textStyle: { fontSize: 11, color: '#64748b' } },
      grid: { left: 40, right: 20, top: 16, bottom: 36 },
      xAxis: { type: 'category', data: trend.map((p) => p.label), axisLabel: { color: '#94a3b8', fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
      series: [
        { name: '高风险', type: 'bar', stack: 'risk', data: trend.map((p) => p.highRisks), itemStyle: { color: '#dc2626' }, barWidth: 28 },
        { name: '中风险', type: 'bar', stack: 'risk', data: trend.map((p) => p.mediumRisks), itemStyle: { color: '#d97706' } },
        { name: '低风险', type: 'bar', stack: 'risk', data: trend.map((p) => p.lowRisks), itemStyle: { color: '#16a34a' } },
      ],
    };
  }, [trend]);

  // 汇总指标
  const latest = reports[0];
  const best = trend.length ? trend.reduce((a, b) => (a.healthIndex > b.healthIndex ? a : b)) : null;
  const totalDetections = trend.length;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6 md:py-10">
      <PageTitle
        eyebrow="Assessment History"
        title="历史检测与健康趋势分析"
        description="每次复检均基于输入数据重新计算。下方展示历次健康指数、风险数量的变化趋势，以及整改前后的对比分析。"
      />

      {/* ===== 汇总指标卡 ===== */}
      {trend.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">累计检测次数</p>
            <p className="ts-tabular mt-1.5 text-3xl font-bold text-brand">{totalDetections}</p>
            <p className="mt-1 text-[11px] text-slate-400">含复检与历史记录</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">最新健康指数</p>
            <p className={`ts-tabular mt-1.5 text-3xl font-bold ${latest ? (scoreTone(latest.healthIndex) === 'good' ? 'text-status-ok' : scoreTone(latest.healthIndex) === 'warn' ? 'text-status-warn' : 'text-status-risk') : 'text-slate-400'}`}>
              {latest?.healthIndex ?? '—'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{latest ? new Date(latest.createdAt).toLocaleDateString('zh-CN') : '暂无数据'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">历史最高健康分</p>
            <p className="ts-tabular mt-1.5 text-3xl font-bold text-status-ok">{best?.healthIndex ?? '—'}</p>
            <p className="mt-1 text-[11px] text-slate-400">{best ? `${best.date} · ${best.label}` : '暂无数据'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">最新风险数量</p>
            <p className="ts-tabular mt-1.5 text-3xl font-bold text-slate-900">{latest?.risks.length ?? '—'}</p>
            <p className="mt-1 text-[11px] text-slate-400">高风险 {latest?.risks.filter((r) => r.level === 'high').length ?? 0} 项</p>
          </div>
        </section>
      )}

      {/* ===== 健康指数变化趋势图 ===== */}
      {trend.length >= 2 ? (
        <SectionCard title="健康指数变化趋势" icon={TrendingUp} description="历次检测健康指数变化曲线，标记最高与最低值">
          <div className="h-[300px] w-full">
            <ReactECharts option={healthTrendOption} theme="ud" style={{ width: '100%', height: '300px' }} opts={{ renderer: 'canvas' }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-ok" />最高：{best?.healthIndex}（{best?.label}）</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-risk" />最低：{trend.reduce((a, b) => (a.healthIndex < b.healthIndex ? a : b)).healthIndex}（{trend.reduce((a, b) => (a.healthIndex < b.healthIndex ? a : b)).label}）</span>
            <span>波动幅度：{Math.max(...trend.map((p) => p.healthIndex)) - Math.min(...trend.map((p) => p.healthIndex))} 分</span>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="健康指数变化趋势" icon={TrendingUp}>
          <div className="flex h-[200px] flex-col items-center justify-center text-center">
            <TrendingUp className="mb-3 size-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">暂无足够趋势数据</p>
            <p className="mt-1 text-xs text-slate-400">完成至少 2 次检测后，将自动生成健康指数变化趋势图。</p>
          </div>
        </SectionCard>
      )}

      {/* ===== 风险数量变化对比 ===== */}
      {trend.length >= 2 ? (
        <SectionCard title="风险数量变化对比" icon={ShieldAlert} description="按高/中/低风险分级堆叠展示历次检测的风险数量变化">
          <div className="h-[300px] w-full">
            <ReactECharts option={riskTrendOption} theme="ud" style={{ width: '100%', height: '300px' }} opts={{ renderer: 'canvas' }} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-status-risk-soft px-3 py-2">
              <span className="size-2.5 rounded-full bg-status-risk" />
              <span className="text-slate-600">高风险累计：</span>
              <span className="ts-tabular font-semibold text-status-risk">{trend.reduce((s, p) => s + p.highRisks, 0)} 项次</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-status-warn-soft px-3 py-2">
              <span className="size-2.5 rounded-full bg-status-warn" />
              <span className="text-slate-600">中风险累计：</span>
              <span className="ts-tabular font-semibold text-status-warn">{trend.reduce((s, p) => s + p.mediumRisks, 0)} 项次</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-status-ok-soft px-3 py-2">
              <span className="size-2.5 rounded-full bg-status-ok" />
              <span className="text-slate-600">低风险累计：</span>
              <span className="ts-tabular font-semibold text-status-ok">{trend.reduce((s, p) => s + p.lowRisks, 0)} 项次</span>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="风险数量变化对比" icon={ShieldAlert}>
          <div className="flex h-[160px] flex-col items-center justify-center text-center">
            <ShieldAlert className="mb-3 size-8 text-slate-300" />
            <p className="text-sm text-slate-500">完成至少 2 次检测后展示风险数量变化对比。</p>
          </div>
        </SectionCard>
      )}

      {/* ===== 历次检测记录列表 ===== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CalendarClock className="size-4 text-brand-2" />
            历次检测记录
          </h2>
          <span className="text-xs text-slate-400">共 {reports.length} 份报告</span>
        </div>

        <div className="space-y-4">
          {reports.map((report, idx) => {
            const previous = reports.find((r) => r.reportId === report.previousReportId);
            const completed = Object.values(report.remediationStatus ?? {}).filter((s) => s === 'completed').length;
            const inProgress = Object.values(report.remediationStatus ?? {}).some((s) => s === 'in-progress');
            const isExpanded = expandedId === report.reportId;
            const total = report.risks.length;
            const high = report.risks.filter((r) => r.level === 'high').length;
            const medium = report.risks.filter((r) => r.level === 'medium').length;
            const low = report.risks.filter((r) => r.level === 'low').length;
            const healthDelta = previous ? report.healthIndex - previous.healthIndex : null;

            return (
              <article key={report.reportId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="ts-tabular flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                        {reports.length - idx}
                      </span>
                      <span className="mt-1 text-[10px] text-slate-400">{report.recheckOfReportId ? '复检' : '首次'}</span>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                        {report.profile.name}
                        {report.recheckOfReportId ? (
                          <span className="rounded-full bg-status-ok-soft px-2 py-0.5 text-xs font-medium text-status-ok">复检报告</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">首次检测</span>
                        )}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">{new Date(report.createdAt).toLocaleString('zh-CN')} · {report.reportId}</p>
                    </div>
                  </div>
                  <RiskBadge level={report.overallLevel} />
                </div>

                <div className="grid gap-3 px-5 py-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] text-slate-400">健康指数</p>
                    <p className="ts-tabular mt-0.5 flex items-baseline gap-1.5 text-xl font-bold text-slate-900">
                      {report.healthIndex}
                      {healthDelta !== null && (
                        <span className={`text-xs font-medium ${healthDelta >= 0 ? 'text-status-ok' : 'text-status-risk'}`}>
                          {signed(healthDelta)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] text-slate-400">风险数量</p>
                    <p className="ts-tabular mt-0.5 text-xl font-bold text-slate-900">{total} 项</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] text-slate-400">风险分布</p>
                    <p className="mt-0.5 text-sm">
                      <span className="ts-tabular font-semibold text-status-risk">{high}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="ts-tabular font-semibold text-status-warn">{medium}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="ts-tabular font-semibold text-status-ok">{low}</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] text-slate-400">潜在影响</p>
                    <p className="ts-tabular mt-0.5 text-base font-semibold text-slate-900">{formatMoney(report.totalImpactAmount)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
                  <p className="text-sm text-slate-600">
                    整改状态：
                    {!total ? '无需整改' : completed === total ? '已完成' : completed || inProgress ? '整改中' : '待整改'}
                    {total > 0 && <span className="ts-tabular ml-1 text-slate-400">（{completed}/{total}）</span>}
                  </p>
                  <div className="flex flex-wrap gap-4 text-brand-2">
                    <Link
                      className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                      to="/report"
                      onClick={() => selectReport(report.reportId)}
                    >
                      查看报告 <ArrowRight className="size-3.5" />
                    </Link>
                    {report.inputSnapshot && (
                      <Link
                        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        to={'/recheck/' + encodeURIComponent(report.reportId)}
                      >
                        开始复检 <ArrowRight className="size-3.5" />
                      </Link>
                    )}
                    {previous && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : report.reportId)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-status-ok hover:underline"
                      >
                        <FileBarChart className="size-3.5" />
                        {isExpanded ? '收起对比' : '整改对比'}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && previous && <Comparison previous={previous} current={report} />}
                {report.previousReportId && !previous && (
                  <p className="px-5 pb-4 text-sm text-slate-400">原报告不可用，暂无法对比。</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* ===== 旧版历史记录 ===== */}
      {legacy.length > 0 && (
        <SectionCard title="旧版历史记录" icon={Activity} description="仅保存摘要信息，无法复检或查看完整报告">
          <div className="space-y-2">
            {legacy.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.enterpriseName}</p>
                  <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="ts-tabular">健康分 <strong className="text-brand">{item.healthIndex}</strong></span>
                  <span className="ts-tabular text-slate-500">风险 {item.riskCount} 项</span>
                  <span className="ts-tabular text-slate-500">{formatMoney(item.totalImpactAmount ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {!reports.length && !legacy.length && (
        <SectionCard title="暂无历史检测记录">
          <p className="text-sm text-slate-500">完成首次检测后，检测记录、健康趋势与复检对比将在此展示。</p>
        </SectionCard>
      )}
    </main>
  );
}
