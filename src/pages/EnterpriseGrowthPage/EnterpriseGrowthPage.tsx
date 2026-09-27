import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ArrowRight, CalendarClock, FileBarChart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, PageTitle, RiskBadge, SectionCard } from '@/components/TaxShieldPrimitives';
import { loadProfile, loadReports, selectReport } from '@/lib/taxshield-store';
import { buildGrowthRecords } from '@/modules/health-profile/growth-records';

export default function EnterpriseGrowthPage() {
  const enterprise = useMemo(loadProfile, []);
  const records = useMemo(() => buildGrowthRecords(loadReports(), enterprise.id), [enterprise.id]);
  const reports = records.map(({ report }) => report);
  const trend = useMemo(() => records.map((record, index) => ({ ...record, label: `第${index + 1}次`, date: new Date(record.report.createdAt).toLocaleDateString('zh-CN') })), [records]);
  const delta = reports.length ? reports[reports.length - 1].healthIndex - reports[0].healthIndex : 0;
  const chartOption = useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'axis' }, grid: { left: 40, right: 20, top: 22, bottom: 34 },
    xAxis: { type: 'category', data: trend.map((item) => item.label), axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{ name: '健康指数', type: 'line', smooth: true, symbolSize: 8, data: trend.map((item) => item.report.healthIndex), lineStyle: { color: '#1a365d', width: 3 }, itemStyle: { color: '#1a365d' }, areaStyle: { color: 'rgba(26,54,93,0.12)' } }],
  }), [trend]);

  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6 md:py-10">
    <PageTitle eyebrow="Enterprise Growth Record" title="企业成长档案" description={`${enterprise.name} · 仅展示当前企业已保存的报告；复检按父报告编号关联。单次检测不代表长期趋势。`} />
    {!reports.length ? <EmptyState icon={FileBarChart} title="尚无企业成长记录" description="完成首次财税健康检测后，这里将自动读取已有历史报告，展示整改与复检过程。" action={<Button asChild><Link to="/upload">开始首次检测</Link></Button>} /> : <>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">最早留存检测（分）</p><p className="ts-tabular mt-2 text-3xl font-bold text-brand">{trend[0].report.healthIndex}</p><p className="mt-1 text-xs text-slate-400">{trend[0].date} · {trend[0].report.risks.length} 项风险</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">最新复检 / 检测</p><p className="ts-tabular mt-2 text-3xl font-bold text-status-ok">{trend[trend.length - 1].report.healthIndex}</p><p className="mt-1 text-xs text-slate-400">{trend[trend.length - 1].date} · {trend[trend.length - 1].report.risks.length} 项风险</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">首末留存检测差值（分）</p><p className={`ts-tabular mt-2 text-3xl font-bold ${delta > 0 ? 'text-status-ok' : delta < 0 ? 'text-status-risk' : 'text-slate-700'}`}>{delta > 0 ? '+' : ''}{delta}</p><p className="mt-1 text-xs text-slate-400">时间序列差值，不等同于一次整改效果</p></div>
      </section>
      <SectionCard title="健康指数变化趋势" icon={TrendingUp} description="至少两次检测后可观察完整变化曲线；单次检测仅展示当前点。">
        <div className="h-[280px] w-full"><ReactECharts option={chartOption} theme="ud" style={{ width: '100%', height: '280px' }} opts={{ renderer: 'canvas' }} /></div>
      </SectionCard>
      <SectionCard title="检测—整改—复检时间线" icon={CalendarClock} description="Checklist 表示整改执行记录；是否解除风险仍需依靠新数据重新检测。">
        <div className="space-y-3">
          {trend.map(({ report, label, date, parentReportId, parent, relation }) => <div key={report.reportId} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center">
            <div className="w-24 shrink-0"><p className="text-xs font-semibold text-brand">{label}</p><p className="mt-1 text-xs text-slate-400">{date}</p></div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-slate-800">{parentReportId ? '复检报告' : '独立检测'}</p><RiskBadge level={report.overallLevel} size="sm" /></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">健康指数 {report.healthIndex} 分 · 风险 {report.risks.length} 项</p>
              <p className="break-all text-xs leading-5 text-slate-500">报告编号：{report.reportId}</p>
              {parent && <p className="break-all text-xs leading-5 text-slate-600">父报告：{parent.reportId} · 健康分 {parent.healthIndex} → {report.healthIndex} 分 · 风险 {parent.risks.length} → {report.risks.length} 项{parent.engineVersion !== report.engineVersion ? '（引擎版本不同，请谨慎比较）' : ''}</p>}
              {relation === 'missing' && <p className="text-xs text-amber-700">当前企业未找到有效父报告，暂不展示复检对比。</p>}
              {relation === 'conflict' && <p className="text-xs text-amber-700">父报告关联字段不一致，暂不展示复检对比。</p>}
            </div>
            <Button asChild size="sm" variant="outline"><Link to="/report" onClick={() => selectReport(report.reportId)}>查看报告 <ArrowRight className="ml-1 size-3.5" /></Link></Button>
          </div>)}
        </div>
      </SectionCard>
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-500">企业成长档案仅展示本地保存的检测与复检报告，不构成企业信用评级、融资审批或任何金融机构意见。</p>
    </>}
  </main>;
}
