import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  BrainCircuit,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileDown,
  FolderCheck,
  Hash,
  Info,
  Loader2,
  PieChart,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AIAttribution,
  ComplianceNote,
  EmptyReport,
  formatMoney,
  HealthScoreDial,
  MetaItem,
  PageTitle,
  RiskBadge,
  scoreTone,
  SectionCard,
  StatCard,
} from '@/components/TaxShieldPrimitives';
import { generateRemediationPlan } from '@/modules/ai';
import type { RiskRecord, TaxHealthReport } from '@/modules/domain/types';
import type { ChecklistItem, RectificationPlan } from '@/modules/rectification';
import { loadChecklists, loadRectificationPlans, loadReport, loadReportById, loadReports, saveRectificationPlan, toggleChecklistItem } from '@/lib/taxshield-store';
import { compareReports } from '@/modules/report/report-diff';
import { usePdfExport } from '@/hooks/use-pdf-export';
import TaxHealthReportDocument from '@/pages/ReportPage/components/TaxHealthReportDocument';
import FinancingReadinessCard from '@/components/FinancingReadinessCard';
import { generateFinancingReadiness } from '@/modules/financing/financing-readiness';
import { loadMaterialSelections } from '@/modules/financing/financing-store';

function policyStatusLabel(status: 'current' | 'review-required' | 'superseded') {
  return status === 'current' ? '现行有效' : status === 'superseded' ? '已失效' : '适用性待复核';
}

function rectificationStatusLabel(status: RectificationPlan['status']) {
  return status === 'pending' ? '待整改' : status === 'in-progress' ? '整改中' : '已完成';
}

function rectificationStatusTone(status: RectificationPlan['status']) {
  return status === 'completed'
    ? 'bg-status-ok-soft text-status-ok border-status-ok-line'
    : status === 'in-progress'
      ? 'bg-status-warn-soft text-status-warn border-status-warn-line'
      : 'bg-slate-100 text-slate-600 border-slate-200';
}

function RiskRadarChart({ risks }: { risks: RiskRecord[] }) {
  if (risks.length < 3) return <p className="py-8 text-center text-sm leading-6 text-slate-400">风险项少于 3 类，暂不展示风险画像雷达图。</p>;
  const n = risks.length;
  const cx = 140, cy = 140, R = 104;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });
  const polygon = (pts: Array<{ x: number; y: number }>) => pts.map((p) => `${p.x},${p.y}`).join(' ');
  const value = (risk: RiskRecord) => Math.max(6, Math.round(risk.probability * risk.severity * 100));
  const valuePoints = risks.map((_, i) => point(i, (R * value(risks[i])) / 100));
  return (
    <svg viewBox="0 0 280 280" className="mx-auto w-full max-w-[300px]" role="img" aria-label="风险画像雷达图">
      {[0.25, 0.5, 0.75, 1].map((level) => <polygon key={level} points={polygon(risks.map((_, i) => point(i, R * level)))} fill="none" stroke="#e2e8f0" />)}
      {risks.map((_, i) => <line key={i} x1={cx} y1={cy} x2={point(i, R).x} y2={point(i, R).y} stroke="#e2e8f0" />)}
      <polygon points={polygon(valuePoints)} fill="#2563eb" fillOpacity="0.18" stroke="#2563eb" strokeWidth="2" />
      {valuePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563eb" />)}
      {risks.map((risk, i) => { const p = point(i, R + 20); return <text key={risk.id} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="#64748b" style={{ fontSize: 10 }}>{risk.category}</text>; })}
    </svg>
  );
}

function RectificationCard({ plan, checklist, onToggle }: { plan: RectificationPlan; checklist: ChecklistItem[]; onToggle: (id: string) => void }) {
  const doneCount = checklist.filter((item) => item.done).length;
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  return (
    <section className="mt-5 rounded-2xl border border-status-ok-line bg-status-ok-soft/60 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-brand">
          <span className="ts-gradient-ai flex size-6 items-center justify-center rounded-lg text-white">
            <CheckCircle2 className="size-3.5" />
          </span>
          AI 整改方案
        </h4>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${rectificationStatusTone(plan.status)}`}>
          {rectificationStatusLabel(plan.status)}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        {plan.provider === 'qwen' ? '结果来源：Qwen模型' : '结果来源：Mock离线模板'} · {plan.model || '历史结果'}{plan.generatedAt ? ` · ${new Date(plan.generatedAt).toLocaleString('zh-CN', { hour12: false })}` : ''}
      </p>

      <p className="mt-3.5 text-sm leading-6 text-slate-700">{plan.summary}</p>

      <div className="mt-4">
        <AIAttribution variant="block" text="整改方案基于规则引擎输出的风险记录与本地政策库生成，AI 不参与风险定级。" />
      </div>

      {/* 整改步骤 */}
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-900">整改步骤</p>
        <ol className="mt-2.5 space-y-2">
          {plan.steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl border border-white bg-white/80 p-3">
              <span className="ts-tabular flex size-5 shrink-0 items-center justify-center rounded-md bg-status-ok text-[11px] font-semibold text-white">
                {index + 1}
              </span>
              <span className="text-sm leading-6 text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* Checklist */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">整改任务清单（Checklist）</p>
            <span className="ts-tabular text-xs text-slate-500">{doneCount}/{checklist.length} 已完成</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-status-ok transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 space-y-2">
            {checklist.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6 transition-colors ${
                  item.done
                    ? 'border-status-ok-line bg-status-ok-soft text-slate-400'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-status-ok-line hover:bg-status-ok-soft/40'
                }`}
              >
                <input
                  aria-label={item.content}
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggle(item.id)}
                  className="ts-focus-ring mt-0.5 size-4 shrink-0 accent-[#15803d]"
                />
                <span className={item.done ? 'line-through' : ''}>{item.content}</span>
              </label>
            ))}
            {checklist.length === 0 && <p className="text-xs leading-5 text-slate-400">尚未生成 Checklist 项。</p>}
          </div>
        </div>

        {/* 材料与注意事项 */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <FolderCheck className="size-3.5 text-brand-2" />
              所需材料
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {plan.requiredMaterials.map((material) => (
                <span key={material} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{material}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
            <p className="text-sm font-medium text-slate-900">注意事项</p>
            <ul className="mt-2.5 space-y-2">
              {plan.precautions.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-status-warn" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ReportPage() {
  const [report, setReport] = useState<TaxHealthReport | null>(() => loadReport());
  const [plans, setPlans] = useState<RectificationPlan[]>(() => report ? loadRectificationPlans(report.reportId) : []);
  const [checklists, setChecklists] = useState<ChecklistItem[]>(() => report ? loadChecklists(report.reportId) : []);
  const [generatingRiskId, setGeneratingRiskId] = useState<string | null>(null);

  function refreshRectificationState() {
    const currentReport = loadReport();
    setReport(currentReport);
    setPlans(currentReport ? loadRectificationPlans(currentReport.reportId) : []);
    setChecklists(currentReport ? loadChecklists(currentReport.reportId) : []);
  }

  async function handleGeneratePlan(risk: RiskRecord) {
    if (!report) return;
    setGeneratingRiskId(risk.id);
    try {
      const plan = await generateRemediationPlan(risk, report.reportId);
      saveRectificationPlan(plan);
      refreshRectificationState();
    } finally {
      setGeneratingRiskId(null);
    }
  }

  function handleToggleChecklist(itemId: string) {
    toggleChecklistItem(itemId);
    refreshRectificationState();
  }

  const { exportPdf, isGenerating, portal } = usePdfExport();
  const [exportError, setExportError] = useState<string | null>(null);
  const [includeFinancing, setIncludeFinancing] = useState(true);

  const recheck = useMemo(() => {
    if (!report) return undefined;
    const previousId = report.recheckOfReportId ?? report.previousReportId;
    if (!previousId) return undefined;
    const previous = loadReportById(previousId);
    if (!previous) return undefined;
    return { previous, diff: compareReports(previous, report) };
  }, [report]);

  // ===== 新增模块 hooks（须在 early return 之前声明） =====
  const categoryStats = useMemo(() => {
    if (!report) return [] as Array<{ name: string; count: number; impact: number }>;
    const map = new Map<string, { count: number; impact: number }>();
    for (const r of report.risks) {
      const cur = map.get(r.category) ?? { count: 0, impact: 0 };
      cur.count += 1;
      cur.impact += r.impactAmount;
      map.set(r.category, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.impact - a.impact);
  }, [report]);

  const categoryChartOption = useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 12, top: 8, bottom: 4, containLabel: true },
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
    yAxis: { type: 'category', data: categoryStats.map((c) => c.name), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b', fontSize: 11, width: 80, overflow: 'truncate' } },
    series: [
      {
        name: '风险项数',
        type: 'bar',
        data: categoryStats.map((c) => c.count),
        barWidth: 14,
        itemStyle: { color: '#1a365d', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#475569', fontSize: 10 },
      },
    ],
  }), [categoryStats]);

  const levelChartOption = useMemo<EChartsOption>(() => {
    const high = report?.risks.filter((r) => r.level === 'high').length ?? 0;
    const medium = report?.risks.filter((r) => r.level === 'medium').length ?? 0;
    const low = report?.risks.filter((r) => r.level === 'low').length ?? 0;
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} 项 ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11, color: '#64748b' } },
      series: [{
        type: 'pie',
        radius: ['48%', '74%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: high, name: '高风险', itemStyle: { color: '#dc2626' } },
          { value: medium, name: '中风险', itemStyle: { color: '#d97706' } },
          { value: low, name: '低风险', itemStyle: { color: '#16a34a' } },
        ].filter((d) => d.value > 0),
      }],
    };
  }, [report]);

  const remediationSummary = useMemo(() => {
    if (!report) return { steps: [] as string[], materials: [] as string[], precautions: [] as string[] };
    const steps: string[] = [];
    const materials = new Set<string>();
    const precautions = new Set<string>();
    for (const r of report.risks) {
      r.suggestion.steps.forEach((s) => steps.push(s));
      r.suggestion.requiredMaterials.forEach((m) => materials.add(m));
      r.suggestion.precautions.forEach((p) => precautions.add(p));
    }
    return {
      steps: steps.slice(0, 8),
      materials: Array.from(materials).slice(0, 10),
      precautions: Array.from(precautions).slice(0, 6),
    };
  }, [report]);

  async function handleExportPdf() {
    if (!report) return;
    setExportError(null);
    try {
      // 汇总本地所有报告（按时间正序），用于 PDF 历史趋势章节
      const allReports = loadReports().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      await exportPdf(() => (
        <TaxHealthReportDocument report={report} plans={plans} checklists={checklists} recheck={recheck} historyReports={allReports}
          financing={includeFinancing ? generateFinancingReadiness(report, loadMaterialSelections(report.profile.id, report.reportId), checklists) : undefined} />
      ));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'PDF 生成失败，请稍后重试。');
    }
  }

  if (!report) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <PageTitle eyebrow="AI Tax Report" title="企业税务健康体检报告" description="请先完成一次检测以生成报告。" />
        <div className="mt-7">
          <EmptyReport action={<Button asChild className="gap-2 bg-brand hover:bg-brand-600"><Link to="/upload">前往数据上传</Link></Button>} />
        </div>
      </main>
    );
  }

  const completedRisks = Object.values(report.remediationStatus ?? {}).filter((s) => s === 'completed').length;
  const totalRisks = report.risks.length;
  const doneChecklist = checklists.filter((item) => item.done).length;
  const hasAiExplanation = Object.keys(report.aiExplanationSnapshot ?? {}).length > 0;
  const createdAtText = new Date(report.createdAt).toLocaleString('zh-CN', { hour12: false });

  // ===== 新增模块：税务画像 / 健康指数解释 / 风险分类统计 / 等级分布 / 整改摘要 =====
  const highCount = report.risks.filter((r) => r.level === 'high').length;
  const mediumCount = report.risks.filter((r) => r.level === 'medium').length;
  const lowCount = report.risks.filter((r) => r.level === 'low').length;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 md:px-6 md:py-10">
      <PageTitle
        eyebrow="AI Tax Report"
        title="企业税务健康体检报告"
        description={`${report.profile.name} · 企业内部财税健康管理参考。规则引擎形成核查提示，AI辅助解释与整改建议，政策参考来自本地资料库。`}
        action={
          <Button onClick={handleExportPdf} disabled={isGenerating} className="gap-2 bg-brand shadow-md hover:bg-brand-600">
            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            {isGenerating ? '正在生成…' : '导出 PDF 报告'}
          </Button>
        }
      />
      {exportError && (
        <p role="alert" className="rounded-xl border border-status-risk-line bg-status-risk-soft px-4 py-3 text-sm leading-6 text-status-risk">{exportError}</p>
      )}
      {portal}
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={includeFinancing} onChange={(event) => setIncludeFinancing(event.target.checked)} />
        PDF附加融资准备建议（取消后导出原健康报告）
      </label>

      {/* ===== 报告头：编号 / 企业信息 / 生成时间 / 健康指数 ===== */}
      <section className="ts-gradient-brand relative overflow-hidden rounded-2xl p-6 text-white shadow-[0_20px_50px_-24px_rgba(26,54,93,0.7)] md:p-7">
        <div className="ts-grid-texture pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.16em] text-blue-200 uppercase">Tax Health Report</p>
            <h2 className="mt-2 text-xl leading-8 font-semibold">企业税务健康体检报告</h2>
            <p className="mt-1.5 flex items-center gap-2 text-base font-medium text-white">
              <Building2 className="size-4 shrink-0 text-blue-200" />
              <span className="truncate">{report.profile.name}</span>
            </p>

            <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-white/15 pt-4 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-xs text-blue-100">
                <Hash className="size-3.5 shrink-0 text-blue-200" />
                报告编号：<span className="ts-tabular min-w-0 break-all font-medium text-white">{report.reportId}</span>
              </p>
              <p className="flex items-center gap-2 text-xs text-blue-100">
                <CalendarClock className="size-3.5 shrink-0 text-blue-200" />
                生成时间：<span className="ts-tabular font-medium text-white">{createdAtText}</span>
              </p>
              <p className="flex items-center gap-2 text-xs text-blue-100">
                <Database className="size-3.5 shrink-0 text-blue-200" />
                数据来源：<span className="font-medium text-white">{report.dataSource === 'uploaded' ? '企业上传数据' : '内置演示数据'}</span>
              </p>
              <p className="flex items-center gap-2 text-xs text-blue-100">
                <ClipboardCheck className="size-3.5 shrink-0 text-blue-200" />
                引擎版本：<span className="ts-tabular font-medium text-white">{report.engineVersion}</span>
                <span className="text-blue-200">/ 规则 {report.ruleVersion}</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-5 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-5 backdrop-blur-sm">
            <HealthScoreDial score={report.healthIndex} variant="dark" size={132} />
            <div className="space-y-3.5">
              <div>
                <p className="text-[11px] text-blue-200">总体等级</p>
                <p className="mt-1.5"><RiskBadge level={report.overallLevel} size="sm" /></p>
              </div>
              <div>
                <p className="text-[11px] text-blue-200">影响金额</p>
                <p className="ts-tabular mt-1 text-lg font-semibold">{formatMoney(report.totalImpactAmount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-blue-200">风险事项</p>
                <p className="ts-tabular mt-1 text-lg font-semibold">{report.risks.length} 项</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI 辅助分析标识 */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/15 pt-4 text-xs text-blue-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 font-medium text-white ring-1 ring-white/20">
            <Sparkles className="size-3.5" />
            AI 辅助分析
          </span>
          <span>风险结论由规则引擎判定 · AI 负责解释与整改建议 · 政策依据来自本地知识库</span>
          <span className="text-blue-200">{hasAiExplanation ? '本报告含 AI 生成内容' : '本报告暂未生成 AI 解释'}</span>
        </div>
      </section>

      <section aria-label="风险管理闭环" className="rounded-2xl border border-slate-200 bg-white p-5">
        <ol className="grid gap-4 sm:grid-cols-4">
          {[
            ['风险发现', `${report.risks.length} 项规则检测结果`],
            ['AI解释', '基于风险证据辅助解读'],
            ['整改执行', '方案、材料与任务清单'],
            ['复检验证', recheck ? '已生成前后对比' : '修改数据后重新检测'],
          ].map(([title, detail], index) => (
            <li key={title} className="flex items-start gap-3">
              <span className="ts-tabular flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-sm font-semibold text-brand-2">{index + 1}</span>
              <div><p className="text-sm font-semibold text-slate-900">{title}{index < 3 && <span aria-hidden="true" className="ml-3 text-slate-300">→</span>}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">Checklist 完成仅代表整改流程已执行，不代表风险已解除；健康分与风险结果必须由新数据重新检测产生。</p>
      </section>

      {/* ===== 报告要点统计 ===== */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} tone={scoreTone(report.healthIndex) === 'good' ? 'good' : scoreTone(report.healthIndex) === 'warn' ? 'warn' : 'bad'} label="税务健康指数" value={`${report.healthIndex}/100`} detail="规则引擎加权计算" />
        <StatCard icon={ClipboardCheck} label="风险事项" value={`${report.risks.length} 项`} detail={`已完成整改 ${completedRisks} 项`} />
        <StatCard icon={CheckCircle2} tone={doneChecklist === checklists.length && checklists.length > 0 ? 'good' : 'default'} label="Checklist 进度" value={checklists.length ? `${doneChecklist}/${checklists.length}` : '—'} detail={checklists.length ? '整改任务勾选进度' : '尚未生成整改清单'} />
        <StatCard icon={BrainCircuit} label="AI 解释覆盖" value={`${Object.keys(report.aiExplanationSnapshot ?? {}).length}/${report.risks.length}`} detail="已生成解释的风险项" />
      </section>

      {/* ===== 新增：企业税务画像 + 健康指数组成解释 ===== */}
      <section className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="企业税务画像" icon={Building2} description="基于企业基础信息与申报数据，不代表税务机关认定">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <MetaItem label="所属行业" value={{ software: '软件信息技术', trade: '商贸批发', manufacturing: '制造业', catering: '餐饮服务' }[report.profile.industry] ?? report.profile.industry} />
            <MetaItem label="成立年份" value={`${report.profile.foundedYear} 年`} />
            <MetaItem label="纳税人类型" value={report.profile.taxpayerType === 'general' ? '一般纳税人' : '小规模纳税人'} />
            <MetaItem label="高新技术企业" value={report.profile.isHighTechEnterprise ? '是' : '否'} />
            <MetaItem label="主要税种" value={report.profile.mainTaxes.join('、')} />
            <MetaItem label="员工规模" value={`${report.profile.employeeCount} 人`} />
          </div>
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-brand-2" />
              <div>
                <p className="text-[11px] text-slate-400">年营业收入</p>
                <p className="ts-tabular text-base font-semibold text-slate-900">{formatMoney(report.profile.annualRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PieChart className="size-4 text-brand-2" />
              <div>
                <p className="text-[11px] text-slate-400">会计收入</p>
                <p className="ts-tabular text-base font-semibold text-slate-900">{formatMoney(report.inputSnapshot.financial.accountingRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-brand-2" />
              <div>
                <p className="text-[11px] text-slate-400">进项税额</p>
                <p className="ts-tabular text-base font-semibold text-slate-900">{formatMoney(report.inputSnapshot.invoice.inputTax)}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="健康指数组成解释" icon={Info} description="规则引擎加权计算，AI 不参与定级">
          <div className="flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-soft/50 p-4">
            <div className="text-center">
              <p className="ts-tabular text-4xl font-bold text-brand">{report.healthIndex}</p>
              <p className="text-[11px] text-slate-500">/ 100 分</p>
            </div>
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">风险数量权重</span>
                <span className="ts-tabular font-medium text-slate-700">{report.risks.length} 项 · 30%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">风险等级权重</span>
                <span className="ts-tabular font-medium text-slate-700">高 {highCount} / 中 {mediumCount} / 低 {lowCount} · 40%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">影响金额权重</span>
                <span className="ts-tabular font-medium text-slate-700">{formatMoney(report.totalImpactAmount)} · 30%</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            健康指数综合考虑风险数量、风险等级及影响金额三个维度。
            高风险项扣分权重最高，影响金额越大扣分越多。
            该指数为内部自评参考，不代表企业不存在风险，也不等同于纳税信用等级。
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500">
            <Info className="mt-0.5 size-3 shrink-0 text-brand-2" />
            指数 ≥80 为良好，≥60 需关注，&lt;60 风险较高。建议结合下方风险明细逐项复核。
          </div>
        </SectionCard>
      </section>

      {/* ===== 新增：风险分类统计 + 风险等级分布 ===== */}
      <section className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="风险分类统计" icon={PieChart} description="按风险类别聚合检测结果，按影响金额降序">
          <div className="h-[260px] w-full">
            <ReactECharts option={categoryChartOption} theme="ud" style={{ width: '100%', height: '260px' }} opts={{ renderer: 'canvas' }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            {categoryStats.map((c) => (
              <div key={c.name} className="rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2">
                <p className="truncate text-slate-600">{c.name}</p>
                <p className="ts-tabular mt-0.5 text-sm font-semibold text-brand">{c.count} 项</p>
                <p className="ts-tabular text-[10px] text-slate-400">影响 {formatMoney(c.impact)}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="风险等级分布" icon={ShieldCheck} description="高 / 中 / 低 三级分布一览">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <div className="h-[200px]">
              <ReactECharts option={levelChartOption} theme="ud" style={{ width: '100%', height: '200px' }} opts={{ renderer: 'canvas' }} />
            </div>
            <div className="space-y-2.5">
              {[
                { level: 'high' as const, label: '高风险', count: highCount, tone: 'text-status-risk', bg: 'bg-status-risk-soft border-status-risk-line' },
                { level: 'medium' as const, label: '中风险', count: mediumCount, tone: 'text-status-warn', bg: 'bg-status-warn-soft border-status-warn-line' },
                { level: 'low' as const, label: '低风险', count: lowCount, tone: 'text-status-ok', bg: 'bg-status-ok-soft border-status-ok-line' },
              ].map((item) => (
                <div key={item.level} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${item.bg}`}>
                  <div>
                    <p className={`text-xs font-semibold ${item.tone}`}>{item.label}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.level === 'high' ? '需要优先处理' : item.level === 'medium' ? '建议关注整改' : '持续监控'}
                    </p>
                  </div>
                  <p className={`ts-tabular text-2xl font-bold ${item.tone}`}>{item.count}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <p className="text-[11px] leading-5 text-slate-500">
              共 <span className="ts-tabular font-semibold text-slate-800">{totalRisks}</span> 项风险，
              高风险占比 <span className="ts-tabular font-semibold text-status-risk">{totalRisks ? Math.round((highCount / totalRisks) * 100) : 0}%</span>，
              累计影响金额 <span className="ts-tabular font-semibold text-slate-800">{formatMoney(report.totalImpactAmount)}</span>。
            </p>
          </div>
        </SectionCard>
      </section>

      {/* ===== 新增：整改建议摘要 ===== */}
      <SectionCard title="整改建议摘要" icon={ClipboardCheck} description="聚合全部风险项的整改方向、所需材料与注意事项">
        <div className="grid gap-5 md:grid-cols-3">
          {/* 核心整改步骤 */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CheckCircle2 className="size-4 text-status-ok" />
              核心整改步骤
            </p>
            <ol className="mt-3 space-y-2">
              {remediationSummary.steps.map((step, i) => (
                <li key={step} className="flex gap-2.5 text-xs leading-5 text-slate-600">
                  <span className="ts-tabular flex size-4 shrink-0 items-center justify-center rounded bg-status-ok-soft text-[10px] font-semibold text-status-ok">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          {/* 所需材料 */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FolderCheck className="size-4 text-brand-2" />
              所需材料清单
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {remediationSummary.materials.map((m) => (
                <span key={m} className="rounded-md bg-white px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200">{m}</span>
              ))}
              {remediationSummary.materials.length === 0 && <p className="text-xs text-slate-400">暂无材料要求</p>}
            </div>
          </div>
          {/* 注意事项 */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Info className="size-4 text-status-warn" />
              注意事项
            </p>
            <ul className="mt-3 space-y-2">
              {remediationSummary.precautions.map((p) => (
                <li key={p} className="flex gap-2 text-xs leading-5 text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-status-warn" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-400">
          本摘要由规则引擎基于各风险项的 suggestion 字段聚合生成，不含 AI 生成内容。具体每项风险的详细整改方案与 Checklist 请参阅下方逐条风险详情。
        </p>
      </SectionCard>

      {/* ===== 风险画像 + 整改闭环进度 ===== */}
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="风险画像" icon={ClipboardCheck} description="展示风险概率与严重度的乘积，不代表税额">
          <RiskRadarChart risks={report.risks} />
        </SectionCard>

        <SectionCard title="整改闭环进度" icon={CheckCircle2} description="全部完成后建议触发复检，生成前后对比">
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm leading-6 text-slate-500">已执行整改流程（非风险解除）</p>
            <p className="ts-tabular text-2xl font-bold text-slate-900">
              {completedRisks}<span className="text-base font-medium text-slate-400"> / {totalRisks}</span>
            </p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-status-ok transition-all duration-300" style={{ width: `${totalRisks ? (completedRisks / totalRisks) * 100 : 0}%` }} />
          </div>
          <div className="mt-5 space-y-2">
            {report.risks.map((risk) => {
              const status = report.remediationStatus?.[risk.id] ?? 'pending';
              const label = status === 'completed' ? '已完成' : status === 'in-progress' ? '整改中' : '待整改';
              const tone = status === 'completed' ? 'border-status-ok-line bg-status-ok-soft text-status-ok' : status === 'in-progress' ? 'border-status-warn-line bg-status-warn-soft text-status-warn' : 'border-slate-200 bg-slate-100 text-slate-500';
              return (
                <div key={risk.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 text-sm last:border-0">
                  <span className="truncate text-slate-600">{risk.riskName}</span>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tone}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </section>

      {/* ===== 复检对比（若为复检报告） ===== */}
      {recheck && (
        <SectionCard title="复检对比" icon={Sparkles} description={`对比基准报告：${recheck.previous.reportId}`}>
          <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-slate-200/70 bg-slate-50/70 px-5 py-6">
            <div className="text-center">
              <p className="text-xs text-slate-500">整改前</p>
              <p className="ts-tabular mt-1.5 text-3xl font-bold text-slate-400">{recheck.diff.healthIndexBefore}</p>
            </div>
            <span className="text-2xl text-slate-300">→</span>
            <div className="text-center">
              <p className="text-xs text-slate-500">整改后</p>
              <p className="ts-tabular mt-1.5 text-3xl font-bold text-status-ok">{recheck.diff.healthIndexAfter}</p>
            </div>
            <div className="rounded-xl border border-status-ok-line bg-status-ok-soft px-4 py-2.5 text-center">
              <p className="text-xs text-slate-600">健康指数变化</p>
              <p className={`ts-tabular mt-1 text-2xl font-bold ${recheck.diff.healthIndexDelta < 0 ? 'text-status-risk' : recheck.diff.healthIndexDelta > 0 ? 'text-status-ok' : 'text-slate-600'}`}>{recheck.diff.healthIndexDelta > 0 ? '+' : ''}{recheck.diff.healthIndexDelta}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetaItem label="影响金额变化" value={`${formatMoney(recheck.diff.impactAmountBefore)} → ${formatMoney(recheck.diff.impactAmountAfter)}`} />
            <MetaItem label="已解除风险" value={recheck.diff.resolvedRiskIds.length ? `${recheck.diff.resolvedRiskIds.length} 项` : '无'} />
            <MetaItem label="新增风险" value={recheck.diff.newRiskIds.length ? `${recheck.diff.newRiskIds.length} 项` : '无'} />
          </div>
        </SectionCard>
      )}

      {/* ===== 一、企业画像与数据来源 ===== */}
      <SectionCard title="一、企业画像与数据来源" icon={Building2}>
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <MetaItem label="企业名称" value={report.profile.name} />
          <MetaItem label="所在地区" value={report.profile.region} />
          <MetaItem label="员工人数" value={`${report.profile.employeeCount} 人`} />
          <MetaItem label="年营业收入" value={formatMoney(report.profile.annualRevenue)} />
          <MetaItem label="纳税人类型" value={report.profile.taxpayerType === 'general' ? '一般纳税人' : '小规模纳税人'} />
          <MetaItem label="主要税种" value={report.profile.mainTaxes.join('、')} />
        </div>
        <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Database className="size-3.5 text-brand-2" />
            数据来源说明
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            检测范围：财务数据 / 发票数据 / 申报数据 / 月度趋势。
            本次数据来源于{report.dataSource === 'uploaded' ? '企业上传的报表与申报文件' : '系统内置的比赛演示企业数据'}，
            全部指标由规则引擎按 {report.ruleVersion} 规则集计算，AI 不参与数值生成或篡改。
          </p>
        </div>
      </SectionCard>

      {/* ===== 二、风险、证据与整改闭环 ===== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">二、风险、证据与整改闭环</h2>
          <span className="text-xs text-slate-400">共 {report.risks.length} 项 · 结论由 Risk Engine 判定</span>
        </div>

        {report.risks.map((risk, index) => {
          const plan = plans.find((item) => item.riskId === risk.id);
          const checklist = checklists.filter((item) => item.riskId === risk.id);
          const explanation = report.aiExplanationSnapshot?.[risk.id];
          const isGenerating = generatingRiskId === risk.id;
          return (
            <article key={risk.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-14px_rgba(15,23,42,0.14)]">
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4 ${
                risk.level === 'high' ? 'border-l-4 border-l-status-risk' : risk.level === 'medium' ? 'border-l-4 border-l-status-warn' : 'border-l-4 border-l-status-ok'
              }`}>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-2">
                    风险 {String(index + 1).padStart(2, '0')} · {risk.category}
                  </p>
                  <h3 className="mt-1.5 text-base leading-6 font-semibold text-slate-900">{risk.riskName}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <RiskBadge level={risk.level} size="sm" />
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${plan?.status === 'completed' ? 'border-status-ok-line bg-status-ok-soft text-status-ok' : 'border-status-warn-line bg-status-warn-soft text-status-warn'}`}>
                    {plan?.status === 'completed' ? '已完成' : plan ? rectificationStatusLabel(plan.status) : '待整改'}
                  </span>
                  <span className="ts-tabular text-sm font-semibold whitespace-nowrap text-slate-900">{formatMoney(risk.impactAmount)}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* 数据证据与风险原因 */}
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <FileCheck2 className="size-4 text-brand-2" />
                      数据证据与风险原因
                      <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">规则引擎</span>
                    </p>
                    <p className="mt-2.5 text-sm leading-6 text-slate-600">{risk.reason}</p>
                    <ul className="mt-3 space-y-2">
                      {risk.evidence.map((item) => (
                        <li key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-sm leading-6">
                          <span className="text-slate-500">{item.label}：</span>
                          <span className="ts-tabular font-semibold text-slate-900">{item.value}</span>
                          {item.comparison ? <span className="text-slate-400">（{item.comparison}）</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 政策依据 */}
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Scale className="size-4 text-brand-2" />
                      政策依据
                      <span className="ml-1 text-xs font-normal text-slate-400">本地知识库</span>
                    </p>
                    {risk.policyReferences.map((policy) => (
                      <div key={policy.id} className="mt-2.5 rounded-xl border-l-[3px] border-l-brand-2 border-y border-r border-y-slate-200/70 border-r-slate-200/70 bg-slate-50/70 p-3.5">
                        <p className="text-xs font-semibold text-slate-800">《{policy.title}》</p>
                        <p className="ts-tabular mt-1 text-[11px] leading-5 text-slate-500">
                          文号：{policy.documentNumber} · {policy.articleNumber} ·{' '}
                          <span className={policy.status === 'current' ? 'text-status-ok' : 'text-status-warn'}>{policyStatusLabel(policy.status)}</span>
                        </p>
                        <p className="mt-1.5 text-xs leading-5 text-slate-600">{policy.content}</p>
                      </div>
                    ))}
                    {risk.policyReferences.length === 0 && (
                      <p className="mt-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3.5 py-3 text-xs leading-5 text-slate-500">
                        本地政策库暂未匹配到对应条款，请由专业人员补充复核。
                      </p>
                    )}
                  </div>
                </div>

                {/* AI 解释（若已生成） */}
                {explanation && (
                  <div className="mt-6 rounded-2xl border border-ai/15 bg-ai-soft/45 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-brand">
                        <span className="ts-gradient-ai flex size-6 items-center justify-center rounded-lg text-white">
                          <BrainCircuit className="size-3.5" />
                        </span>
                        AI 智能解释
                      </p>
                      <AIAttribution confidence={explanation.confidence} />
                    </div>
                    <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
                        <p className="text-xs font-semibold text-brand-2">风险是什么</p>
                        <p className="mt-1.5">{explanation.summary}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
                        <p className="text-xs font-semibold text-brand-2">为什么产生</p>
                        <p className="mt-1.5">{explanation.reasonAnalysis}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
                        <p className="text-xs font-semibold text-brand-2">可能影响</p>
                        <p className="mt-1.5">{explanation.impact}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
                        <p className="text-xs font-semibold text-brand-2">建议动作</p>
                        <ul className="mt-1.5 space-y-1">
                          {explanation.suggestion.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-2" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="mt-3 border-t border-slate-200/70 pt-2.5 text-[11px] leading-5 text-slate-500">
                      AI 生成免责声明：{explanation.disclaimer}
                    </p>
                  </div>
                )}

                {/* 整改方案生成 */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">整改方案</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        基于本条风险的证据、影响金额与匹配政策生成，含可勾选 Checklist。
                      </p>
                    </div>
                    <Button onClick={() => handleGeneratePlan(risk)} disabled={isGenerating} className="gap-2 bg-status-ok shadow-sm hover:bg-status-ok/90">
                      {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />}
                      {isGenerating ? '正在生成…' : plan ? '重新生成整改方案' : '生成整改方案'}
                    </Button>
                  </div>
                  {plan && <RectificationCard plan={plan} checklist={checklist} onToggle={handleToggleChecklist} />}
                </div>

                {/* 规则引擎建议材料 */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <FolderCheck className="size-3.5 text-brand-2" />
                    规则引擎建议材料
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">规则引擎</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {risk.suggestion.requiredMaterials.map((material) => (
                      <span key={material} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{material}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <FinancingReadinessCard report={report} />
      {report.risks.some((risk) => risk.level === 'high') && <p className="text-sm text-amber-700">建议优先完成高风险事项复核后，再整理融资申请资料。仍可继续查看融资准备页面。</p>}
      <ComplianceNote>
        整改方案仅基于风险引擎已输出的 RiskRecord 生成，AI 不参与风险判断、等级调整或申报决策。全部 Checklist 完成后仅标记该风险的整改流程为已完成，仍建议复检并由专业人员复核。导出 PDF 时采用与页面一致的报告版式（含报告编号、企业信息、数据来源与 AI 辅助分析标识）。
      </ComplianceNote>
    </main>
  );
}
