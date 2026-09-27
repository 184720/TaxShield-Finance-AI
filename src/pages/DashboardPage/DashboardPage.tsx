import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileText,
  FileUp,
  History,
  PlayCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AIAssistantWidget from '@/components/AIAssistantWidget';
import FinancingReadinessCard from '@/components/FinancingReadinessCard';
import TaxHealthProfileCard from '@/components/TaxHealthProfileCard';
import IndustryBenchmarkCard from '@/components/IndustryBenchmarkCard';
import BusinessAdvisorCard from '@/components/BusinessAdvisorCard';
import {
  ComplianceNote,
  EmptyReport,
  formatMoney,
  HealthScoreDial,
  MetaItem,
  RiskBadge,
  scoreBandLabel,
  scoreTone,
  SectionCard,
  StatCard,
  StatusDot,
} from '@/components/TaxShieldPrimitives';
import { loadHistory, loadProfile, loadReport, saveReport } from '@/lib/taxshield-store';
import { WUHAN_ZHICHUANG_DATA } from '@/modules/domain/demo-data';
import { runRiskEngine } from '@/modules/risk-engine';
import type { RiskRecord } from '@/modules/domain/types';

const FLOW = [
  { icon: FileUp, label: '数据' },
  { icon: ShieldCheck, label: '检测' },
  { icon: BrainCircuit, label: '解释' },
  { icon: ClipboardCheck, label: '整改' },
  { icon: TrendingUp, label: '复检' },
  { icon: Building2, label: '融资准备' },
] as const;

/** 按风险等级排序，用于挑选最需要优先处置的事项（仅排序展示，不改变任何判定结果） */
const LEVEL_WEIGHT = { high: 0, medium: 1, low: 2 } as const;

function pickTopRisks(risks: RiskRecord[], limit: number) {
  return [...risks].sort((a, b) => LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level] || b.impactAmount - a.impactAmount).slice(0, limit);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const profile = useMemo(loadProfile, []);
  const report = useMemo(loadReport, []);
  const history = useMemo(loadHistory, []);
  const [demoRunning, setDemoRunning] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const highCount = report?.risks.filter((risk) => risk.level === 'high').length ?? 0;
  const mediumCount = report?.risks.filter((risk) => risk.level === 'medium').length ?? 0;
  const lowCount = report?.risks.filter((risk) => risk.level === 'low').length ?? 0;
  const healthTone = !report ? 'default' : scoreTone(report.healthIndex);
  const topRisks = report ? pickTopRisks(report.risks, 3) : [];

  // 经营趋势：仅当拥有 ≥2 期月度数据时渲染真实图表，否则展示空状态说明
  const trendChartOption = useMemo<EChartsOption | null>(() => {
    const trend = report?.trend ?? [];
    if (trend.length < 2) return null;
    const months = trend.map((item) => item.month.slice(5));
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        valueFormatter: (val) => formatMoney(Number(val)),
      },
      legend: { data: ['收入', '成本', '利润总额'], bottom: 0, textStyle: { fontSize: 11, color: '#64748b' } },
      grid: { left: 44, right: 16, top: 16, bottom: 36 },
      xAxis: { type: 'category', data: months, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (val: number) => `${Math.round(val / 10000)}万` },
      },
      series: [
        { name: '收入', type: 'bar', data: trend.map((item) => item.revenue), barWidth: 14, itemStyle: { color: '#1a365d', borderRadius: [4, 4, 0, 0] } },
        { name: '成本', type: 'bar', data: trend.map((item) => item.cost), barWidth: 14, itemStyle: { color: '#94a3b8', borderRadius: [4, 4, 0, 0] } },
        {
          name: '利润总额',
          type: 'line',
          data: trend.map((item) => Math.max(0, item.revenue - item.cost - item.expenses)),
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { color: '#3d6bb5', width: 2.5 },
          itemStyle: { color: '#3d6bb5' },
        },
      ],
    };
  }, [report?.trend]);

  function startDemo() {
    setDemoRunning(true);
    window.setTimeout(() => {
      saveReport(runRiskEngine(loadProfile(), WUHAN_ZHICHUANG_DATA, 'demo'));
      navigate('/risk-analysis');
    }, 350);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 md:px-6 md:py-10">
      {/* ===== 产品品牌区 ===== */}
      <section className="ts-gradient-brand relative overflow-hidden rounded-2xl px-6 py-7 text-white shadow-[0_20px_50px_-24px_rgba(26,54,93,0.75)] md:px-8 md:py-8">
        <div className="ts-grid-texture pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand-2/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 ring-1 ring-white/20">
              <ShieldCheck className="size-3.5" />
              财税自查与融资材料准备
            </div>
            <h1 className="mt-5 text-3xl leading-tight font-bold tracking-tight md:text-4xl">税智盾 TaxShield AI</h1>
            <p className="mt-3 max-w-xl text-lg leading-8 text-white">
              小微企业财税健康管理与融资准备平台
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              帮助企业形成可理解、可复核的经营数据，旨在降低银企信息不对称；实际效果仍需真实场景验证。
            </p>
            <p className="mt-2 text-xs leading-6 text-blue-200">规则引擎检测 · 本地政策关联 · AI 辅助解释与整改 · 历史趋势对比</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="gap-2 bg-white text-brand shadow-lg hover:bg-blue-50">
                <Link to="/upload">
                  <FileUp className="size-4" />
                  上传数据并检测
                </Link>
              </Button>
              <Button
                onClick={startDemo}
                disabled={demoRunning}
                variant="outline"
                className="gap-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                {demoRunning ? <Sparkles className="size-4 animate-pulse" /> : <PlayCircle className="size-4" />}
                {demoRunning ? '正在生成…' : '体验 Demo 企业'}
              </Button>
            </div>
          </div>

          {/* 当前企业与检测时间 */}
          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-4 backdrop-blur-sm lg:min-w-[260px]">
            <p className="text-[11px] tracking-[0.14em] text-blue-200 uppercase">当前企业</p>
            <p className="mt-2 flex items-center gap-2 text-lg leading-7 font-semibold">
              <Building2 className="size-4 shrink-0 text-blue-200" />
              <span className="truncate">{report?.profile.name ?? profile.name}</span>
            </p>
            <div className="mt-3.5 space-y-2 border-t border-white/15 pt-3.5 text-xs text-blue-100">
              <p className="flex items-center justify-between gap-4">
                <span className="text-blue-200">检测时间</span>
                <span className="ts-tabular font-medium">
                  {report ? new Date(report.createdAt).toLocaleString('zh-CN', { hour12: false }) : '尚未检测'}
                </span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span className="text-blue-200">数据来源</span>
                <span className="font-medium">
                  {!report ? '—' : report.dataSource === 'uploaded' ? '企业上传数据' : '演示数据'}
                </span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span className="text-blue-200">引擎版本</span>
                <span className="ts-tabular font-medium">{report?.engineVersion ?? '—'}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 核心能力展示 ===== */}
      <SectionCard title="数据 → 检测 → 解释 → 整改 → 复检 → 融资准备" description="围绕企业侧资料整理与核查展开；融资准备结果不代表任何金融机构授信意见。">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['01', '财税健康体检', '整理财务、发票与申报数据，识别风险证据。'],
            ['02', '风险整改', 'AI辅助解释与整改，修改数据后复检。'],
            ['03', '融资准备', '形成财税健康档案，梳理资料缺口与准备动作。'],
          ].map(([step, title, detail]) => <div key={step} className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-brand-2">{step}</p>
            <h3 className="mt-2 font-semibold text-slate-800">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
          </div>)}
        </div>
      </SectionCard>
      <FinancingReadinessCard report={report} />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Activity, title: '企业财税健康画像', detail: '五维观察规范度、收入波动、数据完整度、整改进度及融资准备；不替代信用评级。', to: '/growth' },
          { icon: TrendingUp, title: '企业成长档案', detail: '串联首次检测、整改过程和复检结果，展示健康指数变化趋势。', to: '/growth' },
          { icon: Building2, title: '融资准备中心', detail: '汇总健康状态、风险情况、整改进度和资料完整情况，服务企业侧准备。', to: '/financing' },
        ].map(({ icon: Icon, title, detail, to }) => <Link key={title} to={to} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-2 transition group-hover:bg-brand group-hover:text-white"><Icon className="size-5" /></span>
          <p className="mt-3.5 text-sm font-semibold text-slate-900">{title}</p><p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p>
        </Link>)}
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShieldCheck, title: '规则风险检测', desc: '用于发现需进一步核查事项，不直接认定违法。' },
          { icon: BrainCircuit, title: '风险解释辅助', desc: '辅助理解已有风险，不参与风险判断。具体结果标明模型或离线模板来源。' },
          { icon: ClipboardCheck, title: '整改闭环管理', desc: '通过整改方案与 Checklist 管理执行进度，复检后呈现风险变化，结果可能改善或恶化。' },
          { icon: History, title: '历史健康趋势', desc: '汇总历次健康指数与风险数量变化，直观查看企业税务健康趋势和整改成效。' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-2 transition group-hover:bg-brand group-hover:text-white">
              <Icon className="size-5" />
            </span>
            <p className="mt-3.5 text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">{desc}</p>
          </div>
        ))}
      </section>

      {/* ===== 健康指数主卡片 ===== */}
      {report ? (
        <section className="grid gap-5 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-14px_rgba(15,23,42,0.14)]">
            <div className="flex w-full items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">Tax Health Index</p>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-2">税务健康指数</span>
            </div>
            <HealthScoreDial score={report.healthIndex} tone={healthTone} size={212} />
            <p className="w-full text-center text-[11px] leading-5 text-slate-400">
              综合风险数量、风险等级及影响程度计算，<br className="sm:hidden" />不代表企业不存在风险。
            </p>
            <div className="grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
              <div>
                <p className="ts-tabular text-xl font-semibold text-status-risk">{highCount}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">高风险</p>
                <p className="mt-0.5 text-[10px] leading-4 text-status-risk">需要优先处理</p>
              </div>
              <div>
                <p className="ts-tabular text-xl font-semibold text-status-warn">{mediumCount}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">中风险</p>
                <p className="mt-0.5 text-[10px] leading-4 text-status-warn">建议关注</p>
              </div>
              <div>
                <p className="ts-tabular text-xl font-semibold text-status-ok">{lowCount}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">低风险</p>
                <p className="mt-0.5 text-[10px] leading-4 text-status-ok">持续监控</p>
              </div>
            </div>
            <div className="w-full border-t border-slate-100 pt-4">
              <RiskBadge level={report.overallLevel} withDescription />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={ClipboardCheck}
                label="风险数量"
                value={`${report.risks.length} 项`}
                detail={`覆盖 ${new Set(report.risks.map((risk) => risk.category)).size} 个风险类别`}
              />
              <StatCard icon={TrendingUp} tone={highCount > 0 ? 'bad' : 'default'} label="高风险事项" value={`${highCount} 项`} detail={highCount > 0 ? '建议优先处置' : '暂无高风险事项'} />
              <StatCard icon={ShieldCheck} label="已识别影响金额" value={formatMoney(report.totalImpactAmount)} tone="brand" detail="潜在影响测算值" />
              <StatCard icon={History} label="历史检测" value={`${history.length} 次`} detail="支持整改前后复检对比" />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-14px_rgba(15,23,42,0.14)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="ts-gradient-ai flex size-6 items-center justify-center rounded-lg text-white">
                    <Sparkles className="size-3.5" />
                  </span>
                  优先关注事项
                </h2>
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs text-brand">按风险等级与影响金额展示</span>
              </div>

              <p className="mt-3.5 text-sm leading-6 text-slate-600">
                企业当前健康指数 <strong className="ts-tabular text-slate-900">{report.healthIndex}</strong> 分（{scoreBandLabel(report.healthIndex)}），
                共识别 <strong className="ts-tabular text-slate-900">{report.risks.length}</strong> 项需关注事项，
                其中高风险 <strong className="ts-tabular text-status-risk">{highCount}</strong> 项。
                {topRisks[0] && <>建议优先处置「<strong className="text-slate-900">{topRisks[0].riskName}</strong>」，预计影响金额 {formatMoney(topRisks[0].impactAmount)}。</>}
              </p>

              <div className="mt-4 space-y-2.5">
                {topRisks.map((risk, index) => {
                  const explanation = report.aiExplanationSnapshot?.[risk.id];
                  const advice = explanation?.suggestion[0] ?? risk.suggestion.summary;
                  return (
                    <div key={risk.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                      <span className="ts-tabular mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-brand text-[11px] font-semibold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <p className="text-sm font-medium text-slate-800">{risk.riskName}</p>
                          <RiskBadge level={risk.level} size="sm" />
                          <span className="ts-tabular text-xs text-slate-400">{formatMoney(risk.impactAmount)}</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{advice}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button asChild className="gap-2 bg-brand hover:bg-brand-600">
                  <Link to="/risk-analysis">
                    查看风险分析
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-brand">
                  <Link to="/report">
                    <FileText className="size-4" />
                    快速进入健康报告
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="税务健康分" value="—" detail="完成首次检测后展示" />
          <StatCard label="风险数量" value="—" detail="尚未检测，不代表无风险" />
          <StatCard label="已识别影响金额" value="—" detail="基于企业数据测算" />
          <StatCard label="历史检测" value={`${history.length} 次`} detail="本地保存的检测记录" />
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <TaxHealthProfileCard report={report} compact />
        <IndustryBenchmarkCard report={report} />
      </section>

      <BusinessAdvisorCard report={report} />

      <SectionCard title="风险理解与整改工作台" icon={BrainCircuit} description="辅助理解已有风险，不参与风险判断。政策参考来自本地资料库。">
        {/* 流程连接：数据 → 规则检测 → AI解释 → 整改闭环（仅视觉，不改变业务逻辑） */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
          {[
            { label: '数据', sub: '企业填报/上传' },
            { label: '规则检测', sub: 'Risk Engine V2' },
            { label: '解释', sub: '基于已有风险证据' },
            { label: '整改', sub: '记录执行进度' },
            { label: '复检', sub: '重新运行规则' },
            { label: '融资准备', sub: '企业侧材料自查' },
          ].map((step, idx, arr) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span className="ts-tabular flex size-6 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
                  {idx + 1}
                </span>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-slate-800">{step.label}</p>
                  <p className="text-[10px] text-slate-400">{step.sub}</p>
                </div>
              </div>
              {idx < arr.length - 1 && <ArrowRight className="size-3.5 shrink-0 text-slate-300" />}
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { title: '风险解释', detail: report ? `已生成 ${report.risks.filter((risk) => report.aiExplanationSnapshot?.[risk.id]).length} / ${report.risks.length} 项解释` : '检测后按需生成', icon: BrainCircuit },
            { title: '政策依据', detail: report ? `${report.risks.filter((risk) => risk.policyReferences.length > 0).length} 项风险已关联本地政策` : '本地结构化政策库', icon: Scale },
            { title: '整改建议', detail: '进入健康报告生成方案与 Checklist', icon: ClipboardCheck },
          ].map(({ title, detail, icon: Icon }) => (
            <div key={title} className="rounded-xl border border-brand-100 bg-brand-soft/40 p-4">
              <Icon className="mb-3 size-5 text-brand-2" />
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
            </div>
          ))}
        </div>

        {/* AI 税务助手入口卡片 */}
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-ai/15 bg-gradient-to-br from-ai-soft/60 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="ts-gradient-ai flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_4px_12px_-4px_rgba(26,54,93,0.4)]">
              <BrainCircuit className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">AI 税务助手</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                基于当前企业风险报告，支持风险解释、整改咨询和材料准备问答
              </p>
            </div>
          </div>
          <Button
            onClick={() => setAiOpen(true)}
            disabled={!report}
            className="shrink-0 gap-2 bg-brand hover:bg-brand-600 disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            立即咨询
          </Button>
        </div>
      </SectionCard>

      {/* ===== 核心闭环叙事 ===== */}
      <SectionCard
        title="从数据到融资准备的六步流程"
        icon={Scale}
        description="规则引擎形成核查提示；AI辅助解释与整改建议，本地资料库提供政策参考。复检不保证分数提高。"
      >
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {FLOW.map(({ icon: Icon, label }, index) => (
            <div key={label} className="relative flex flex-col items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-4 text-center transition-colors hover:border-brand-100 hover:bg-brand-soft">
              <div className="flex size-9 items-center justify-center rounded-lg bg-white text-brand-2 shadow-sm ring-1 ring-slate-200/60">
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-medium text-slate-600">{label}</span>
              <span className="ts-tabular absolute top-2 right-2.5 text-[10px] font-semibold text-slate-300">{String(index + 1).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ===== 检测摘要 + 趋势 ===== */}
      {report ? (
        <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <SectionCard
            title="最新检测摘要"
            icon={ClipboardCheck}
            description={`${new Date(report.createdAt).toLocaleDateString('zh-CN')} 生成 · ${report.profile.name}`}
            action={<RiskBadge level={report.overallLevel} size="sm" />}
          >
            <div className="space-y-2.5">
              {report.risks.slice(0, 4).map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:border-brand-100 hover:bg-brand-soft/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{risk.riskName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {risk.category} · 影响 <span className="ts-tabular">{formatMoney(risk.impactAmount)}</span>
                    </p>
                  </div>
                  <RiskBadge level={risk.level} size="sm" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
              <StatusDot tone="bad">高风险 {highCount}</StatusDot>
              <StatusDot tone="warn">中风险 {mediumCount}</StatusDot>
              <StatusDot tone="good">低风险 {lowCount}</StatusDot>
            </div>
            <Button asChild variant="outline" className="mt-5 gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-brand">
              <Link to="/risk-analysis">
                查看全部风险分析
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </SectionCard>

          <SectionCard title="经营收入趋势" icon={TrendingUp} description="基于当前报告的月度数据展示收入、成本与利润变化，不代表风险等级">
            {trendChartOption ? (
              <div className="h-[260px] w-full">
                <ReactECharts
                  option={trendChartOption}
                  theme="ud"
                  style={{ width: '100%', height: '260px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 text-center">
                <TrendingUp className="mb-3 size-7 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">当前仅有年度数据</p>
                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  趋势分析将在多期检测后生成。建议持续使用本工具进行月度检测，系统将自动产出收入、成本与利润的趋势对比。
                </p>
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-500">收入与成本增幅差异已纳入趋势异常检测，偏离区间将触发对应规则。</p>
          </SectionCard>
        </section>
      ) : (
        <EmptyReport
          action={
            <>
              <Button asChild className="gap-2 bg-brand hover:bg-brand-600">
                <Link to="/upload">
                  <FileUp className="size-4" />
                  上传财务数据
                </Link>
              </Button>
              <Button onClick={startDemo} disabled={demoRunning} variant="outline" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-brand">
                <PlayCircle className="size-4" />
                {demoRunning ? '正在生成…' : '体验 Demo 企业'}
              </Button>
            </>
          }
        />
      )}

      {/* ===== 企业档案 + 历史检测 ===== */}
      <section className="grid gap-5 md:grid-cols-2">
        <SectionCard title="企业档案" icon={Building2} description="用于确定适用政策与行业基准">
          <p className="text-lg leading-7 font-semibold text-slate-800">{profile.name}</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            {profile.region} · {profile.employeeCount} 人 · 年营收 {formatMoney(profile.annualRevenue)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.mainTaxes.map((tax) => (
              <span key={tax} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {tax}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <MetaItem label="纳税人类型" value={profile.taxpayerType === 'general' ? '一般纳税人' : '小规模纳税人'} icon={Building2} />
            <MetaItem label="历史检测次数" value={`${history.length} 次`} icon={History} />
          </div>
          <Button asChild variant="outline" className="mt-5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-brand">
            <Link to="/profile">编辑企业画像</Link>
          </Button>
        </SectionCard>

        <SectionCard title="历史检测" icon={History} description="本地留存，支持整改前后复检对比">
          <p className="text-sm leading-6 text-slate-500">
            已保留 <strong className="ts-tabular text-slate-900">{history.length}</strong> 条本地检测记录。完成整改后修改企业数据，再运行原有规则引擎，查看真实的前后变化；勾选清单不会改变健康分。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {history.slice(0, 4).map((item) => (
              <span key={item.id} className="ts-tabular rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                {new Date(item.createdAt).toLocaleDateString('zh-CN')} · {item.healthIndex} 分
              </span>
            ))}
            {history.length === 0 && <span className="text-xs text-slate-400">暂无历史记录</span>}
          </div>
          <Button asChild variant="outline" className="mt-5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-brand">
            <Link to="/history">查看历史记录</Link>
          </Button>
        </SectionCard>
      </section>

      <ComplianceNote>
        本页健康指数与风险结论均由规则引擎基于企业填报数据计算，AI 不参与风险定级；影响金额为测算值，不构成税务鉴证或申报结论，具体以主管税务机关为准。
      </ComplianceNote>

      {/* ===== 税智盾 AI 助手（驾驶舱入口，受控于本页 aiOpen 状态） ===== */}
      {report && <AIAssistantWidget report={report} open={aiOpen} onOpenChange={setAiOpen} />}
    </main>
  );
}
