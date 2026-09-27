import { useState } from 'react';
import { BrainCircuit, FileCheck2, FileText, RefreshCw, Scale, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AIAttribution,
  AIPendingState,
  ComplianceNote,
  EmptyReport,
  formatMoney,
  HealthScoreDial,
  PageTitle,
  RiskBadge,
  scoreTone,
  SectionCard,
  StatCard,
  StatusDot,
} from '@/components/TaxShieldPrimitives';
import AIAssistantWidget from '@/components/AIAssistantWidget';
import { explainRisk } from '@/modules/ai';
import type { AIExplanation } from '@/modules/domain/types';
import { loadReport, saveAIExplanation } from '@/lib/taxshield-store';

function policyStatusLabel(status: 'current' | 'review-required' | 'superseded') {
  if (status === 'current') return '现行有效';
  if (status === 'superseded') return '已失效';
  return '适用性待复核';
}

function policyStatusTone(status: 'current' | 'review-required' | 'superseded') {
  if (status === 'current') return 'bg-status-ok-soft text-status-ok border-status-ok-line';
  if (status === 'superseded') return 'bg-status-risk-soft text-status-risk border-status-risk-line';
  return 'bg-status-warn-soft text-status-warn border-status-warn-line';
}

/* --------------------------------------------------------------------------
 * AI 解释五段式渲染
 * 结构固定、字段来自 AIExplanation，不做自由文本流式渲染。
 * ------------------------------------------------------------------------ */
function ExplanationCard({ explanation }: { explanation: AIExplanation }) {
  const blocks = [
    { index: '01', title: '风险是什么', content: <p className="mt-1.5">{explanation.summary}</p> },
    { index: '02', title: '为什么产生', content: <p className="mt-1.5">{explanation.reasonAnalysis}</p> },
    {
      index: '03',
      title: '数据证据',
      content: (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {explanation.evidence.map((item) => (
            <span key={`${item.label}-${item.value}`} className="rounded-lg border border-brand-100 bg-brand-soft px-2.5 py-1 text-xs text-slate-700">
              {item.label}：<strong className="ts-tabular font-semibold">{item.value}</strong>
              {item.comparison ? <span className="text-slate-400">（{item.comparison}）</span> : null}
            </span>
          ))}
        </div>
      ),
      span: true,
    },
    { index: '04', title: '可能影响', content: <p className="mt-1.5">{explanation.impact}</p> },
    {
      index: '05',
      title: '建议动作',
      content: (
        <ul className="mt-1.5 space-y-1.5">
          {explanation.suggestion.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${explanation.provider === 'qwen' ? 'bg-status-ok-soft text-status-ok' : 'bg-status-warn-soft text-status-warn'}`}>
          {explanation.provider === 'qwen' ? '结果来源：Qwen模型' : '结果来源：Mock离线模板'}
        </span>
        <span className="text-slate-400">{explanation.model || '历史结果'}{explanation.generatedAt ? ` · ${new Date(explanation.generatedAt).toLocaleString('zh-CN', { hour12: false })}` : ''}</span>
      </div>
      <div className="grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
        {blocks.map((block) => (
          <div key={block.index} className={`rounded-xl border border-slate-200/70 bg-white p-4 ${block.span ? 'md:col-span-2' : ''}`}>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-2">
              <span className="ts-tabular rounded-md bg-brand-soft px-1.5 py-0.5">{block.index}</span>
              {block.title}
            </p>
            {block.content}
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
        辅助理解已有风险，不参与风险判断。{explanation.disclaimer}
      </p>
    </div>
  );
}

export default function RiskAnalysisPage() {
  const report = loadReport();
  const [explanations, setExplanations] = useState<Record<string, AIExplanation>>(() => report?.aiExplanationSnapshot ?? {});
  const [loadingRiskId, setLoadingRiskId] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  if (!report) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <PageTitle eyebrow="Risk Engine V2" title="风险分析" description="请先从数据上传页面发起一次检测。" />
        <div className="mt-7">
          <EmptyReport
            action={
              <Button asChild className="gap-2 bg-brand hover:bg-brand-600">
                <Link to="/upload">前往数据上传</Link>
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  async function handleExplain(riskId: string) {
    const risk = report.risks.find((item) => item.id === riskId);
    if (!risk) return;
    setExplanationError(null);
    setLoadingRiskId(riskId);
    try {
      const explanation = await explainRisk(report.reportId, risk);
      setExplanations((current) => ({ ...current, [riskId]: explanation }));
      saveAIExplanation(explanation);
    } catch {
      setExplanationError('AI 解释暂时无法生成，请稍后重试。风险结论不受影响，仍由规则引擎给出。');
    } finally {
      setLoadingRiskId(null);
    }
  }

  const highCount = report.risks.filter((risk) => risk.level === 'high').length;
  const mediumCount = report.risks.filter((risk) => risk.level === 'medium').length;
  const lowCount = report.risks.filter((risk) => risk.level === 'low').length;
  const explainedCount = report.risks.filter((risk) => explanations[risk.id]).length;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 md:px-6 md:py-10">
      <PageTitle
        eyebrow="Risk Engine V2"
        title="税务风险分析"
        description={`基于 ${report.profile.name} 的${report.dataSource === 'uploaded' ? '上传' : '演示'}数据检测，共识别 ${report.risks.length} 类需关注事项。风险等级与影响金额均由规则引擎判定。`}
        meta={
          <>
            <StatusDot tone="bad">高风险 {highCount}</StatusDot>
            <StatusDot tone="warn">中风险 {mediumCount}</StatusDot>
            <StatusDot tone="good">低风险 {lowCount}</StatusDot>
            <StatusDot tone="brand">已生成 AI 解释 {explainedCount}/{report.risks.length}</StatusDot>
          </>
        }
        action={
          <Button asChild className="gap-2 bg-brand hover:bg-brand-600">
            <Link to="/report">
              <FileText className="size-4" />
              查看健康报告
            </Link>
          </Button>
        }
      />

      <ComplianceNote>用于发现需进一步核查事项，不直接认定违法。AI解释辅助理解已有风险，不参与风险判断；政策条目为本地参考资料，时效与适用性需复核。</ComplianceNote>
      {/* ===== 概览：健康指数 + 关键统计 ===== */}
      <section className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-14px_rgba(15,23,42,0.14)]">
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">Tax Health Index</p>
          <HealthScoreDial score={report.healthIndex} tone={scoreTone(report.healthIndex)} size={176} className="mt-3" />
          <div className="mt-4 w-full border-t border-slate-100 pt-3.5">
            <RiskBadge level={report.overallLevel} size="sm" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard icon={ShieldCheck} tone="brand" label="风险事项总数" value={`${report.risks.length} 项`} detail={`覆盖 ${new Set(report.risks.map((risk) => risk.category)).size} 个风险类别`} />
          <StatCard icon={FileCheck2} tone={highCount > 0 ? 'bad' : 'default'} label="高风险事项" value={`${highCount} 项`} detail={highCount > 0 ? '建议优先处置' : '暂无高风险事项'} />
          <StatCard icon={BrainCircuit} label="预计影响金额" value={formatMoney(report.totalImpactAmount)} detail="潜在影响测算值" />
          <StatCard icon={Sparkles} label="引擎版本" value={report.engineVersion} detail={`规则版本 ${report.ruleVersion}`} />
        </div>
      </section>

      {/* ===== 数据不足提示 ===== */}
      {(report.dataInsufficiencies?.length ?? 0) > 0 && (
        <SectionCard
          title="以下规则因数据不足未执行，不生成风险结论"
          icon={FileCheck2}
          description="关键字段缺失时相关规则未执行，不等于没有风险。补齐数据后可重新检测。"
          className="border-status-warn-line bg-status-warn-soft"
        >
          <div className="flex flex-wrap gap-2">
            {report.dataInsufficiencies.map((item) => (
              <span className="rounded-full border border-status-warn-line bg-white px-3 py-1.5 text-xs text-status-warn" key={item.ruleId}>
                {item.category}：缺少 {item.requiredFields.join('、')}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {explanationError && (
        <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-status-risk-line bg-status-risk-soft px-4 py-3 text-sm leading-6 text-status-risk">
          <BrainCircuit className="mt-0.5 size-4 shrink-0" />
          {explanationError}
        </p>
      )}

      {/* ===== 风险卡片列表 ===== */}
      <section className="space-y-5">
        {report.risks.map((risk, index) => {
          const loading = loadingRiskId === risk.id;
          const explanation = explanations[risk.id];
          return (
            <article
              key={risk.id}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-14px_rgba(15,23,42,0.14)] transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_44px_-18px_rgba(15,23,42,0.22)]"
            >
              {/* 风险头部：等级色条强化视觉分级 */}
              <div
                className={`flex flex-col gap-3.5 border-b border-slate-100 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between ${
                  risk.level === 'high' ? 'border-l-4 border-l-status-risk' : risk.level === 'medium' ? 'border-l-4 border-l-status-warn' : 'border-l-4 border-l-status-ok'
                }`}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-brand-2">
                    <span className="ts-tabular rounded-md bg-white px-1.5 py-0.5 ring-1 ring-brand-100">风险 {String(index + 1).padStart(2, '0')}</span>
                    <span className="text-slate-400">·</span>
                    {risk.category}
                  </p>
                  <h2 className="mt-2 text-lg leading-7 font-semibold text-slate-900">{risk.riskName}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <RiskBadge level={risk.level} withDescription />
                  <div className="text-right">
                    <p className="text-[11px] leading-4 text-slate-400">预计影响金额</p>
                    <p className="ts-tabular text-base font-semibold whitespace-nowrap text-slate-900">{formatMoney(risk.impactAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-5 md:p-6">
                {/* 发现原因 */}
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-brand-soft text-brand-2">
                      <Wrench className="size-3.5" />
                    </span>
                    发现原因
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">规则引擎</span>
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-slate-600">{risk.reason}</p>
                </section>

                {/* 数据证据（表格） */}
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-brand-soft text-brand-2">
                      <FileCheck2 className="size-3.5" />
                    </span>
                    数据证据
                    <span className="ml-1 text-xs font-normal text-slate-400">来自企业填报数据，非 AI 生成</span>
                  </h3>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                          <th className="px-3.5 py-2.5 font-medium">指标</th>
                          <th className="px-3.5 py-2.5 font-medium">数值</th>
                          <th className="px-3.5 py-2.5 font-medium">对比基准</th>
                        </tr>
                      </thead>
                      <tbody>
                        {risk.evidence.map((item) => (
                          <tr key={item.label} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-brand-soft/40">
                            <td className="px-3.5 py-2.5 text-slate-600">{item.label}</td>
                            <td className="ts-tabular px-3.5 py-2.5 font-semibold text-slate-900">{item.value}</td>
                            <td className="px-3.5 py-2.5 text-slate-500">{item.comparison ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* AI 智能解释 */}
                <section className="rounded-2xl border border-ai/15 bg-ai-soft/45 p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-brand">
                      <span className="ts-gradient-ai flex size-6 items-center justify-center rounded-lg text-white">
                        <BrainCircuit className="size-3.5" />
                      </span>
                      AI 风险解释
                    </h3>
                    {explanation ? (
                      <AIAttribution confidence={explanation.confidence} />
                    ) : (
                      <span className="text-[11px] text-slate-400">尚未生成</span>
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">基于企业风险数据分析 · 需专业人员复核</p>
                  {loading ? (
                    <div className="mt-4">
                      <AIPendingState />
                    </div>
                  ) : explanation ? (
                    <>
                      <ExplanationCard explanation={explanation} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 gap-1.5 border-ai/25 bg-white text-ai hover:bg-ai-soft hover:text-ai"
                        onClick={() => handleExplain(risk.id)}
                        disabled={loading}
                      >
                        <RefreshCw className="size-3.5" />
                        重新生成 AI 解释
                      </Button>
                    </>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-6 text-slate-500">
                        点击右侧按钮，AI 将基于上方规则引擎输出的风险数据与本地政策库，生成结构化解释。
                      </p>
                      <Button
                        size="sm"
                        className="shrink-0 gap-1.5 bg-brand hover:bg-brand-600"
                        onClick={() => handleExplain(risk.id)}
                        disabled={loading}
                      >
                        <Sparkles className="size-3.5" />
                        生成 AI 风险解释
                      </Button>
                    </div>
                  )}
                </section>

                {/* 政策依据 */}
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-brand-soft text-brand-2">
                      <Scale className="size-3.5" />
                    </span>
                    政策依据
                    <span className="ml-1 text-xs font-normal text-slate-400">本地结构化政策库，可溯源至文号</span>
                  </h3>
                  <div className="mt-3 space-y-3">
                    {risk.policyReferences.map((policy) => (
                      <div key={policy.id} className="rounded-xl border-l-[3px] border-l-brand-2 border-y border-r border-y-slate-200/70 border-r-slate-200/70 bg-slate-50/70 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">《{policy.title}》</p>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                              文号：<span className="ts-tabular font-medium text-slate-600">{policy.documentNumber}</span> · {policy.issuer}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${policyStatusTone(policy.status)}`}>
                            {policyStatusLabel(policy.status)}
                          </span>
                        </div>
                        <p className="mt-2.5 text-xs font-semibold text-brand-2">{policy.articleNumber}</p>
                        <p className="mt-1.5 text-xs leading-6 text-slate-600">{policy.content}</p>
                        <p className="ts-tabular mt-2.5 border-t border-slate-200/70 pt-2 text-[11px] text-slate-400">生效日期：{policy.effectiveDate}</p>
                      </div>
                    ))}
                    {risk.policyReferences.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3.5 text-xs leading-5 text-slate-500">
                        本地政策库暂未匹配到对应条款，请由专业人员补充复核。系统不会以模型记忆替代知识库内容。
                      </p>
                    )}
                  </div>
                </section>

                {/* 整改入口 */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">下一步：生成整改方案</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">生成整改 Checklist；执行后修改数据并复检，确认风险是否解除。</p>
                  </div>
                  <Button asChild className="gap-2 bg-brand hover:bg-brand-600">
                    <Link to="/report">
                      立即整改
                      <FileText className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <ComplianceNote>
        当前默认解释服务：Qwen 在线 Provider（失败时自动切换 Mock）。每条结果会单独标注真实来源。风险结论、等级与影响金额始终由 Risk Engine V2 生成，AI 仅负责基于上述证据的解释与整改建议，且政策依据全部来自本地知识库。
      </ComplianceNote>

      {/* ===== 税智盾 AI 助手（右下角悬浮入口，仅在此页可见） ===== */}
      <AIAssistantWidget report={report} />
    </main>
  );
}
