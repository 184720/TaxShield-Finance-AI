import { BrainCircuit, CalendarDays, ClipboardList } from 'lucide-react';
import { SectionCard } from '@/components/TaxShieldPrimitives';
import { generateBusinessAdvisor } from '@/modules/ai-business-advisor';
import type { TaxHealthReport } from '@/modules/domain/types';

export default function BusinessAdvisorCard({ report }: { report: TaxHealthReport | null }) {
  if (!report) return null;
  const advice = generateBusinessAdvisor(report);
  return (
    <SectionCard title="经营建议参考" icon={BrainCircuit} description="建议来源包括已有风险记录、整改方案和规则结果；如报告已保存AI建议，则一并汇总。">
      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">本页采用已有结果与本地模板整理行动清单，不额外调用AI。30天、90天为安排参考，不代表个性化经营预测或效果承诺；请结合实际情况由专业人员复核。</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ClipboardList className="size-4 text-brand" />当前问题</p><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">{advice.currentIssues.map((item) => <li key={item}>• {item}</li>)}</ul></div>
        <div className="rounded-xl border border-brand-100 bg-brand-soft/40 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays className="size-4 text-brand" />30天建议</p><ol className="mt-3 space-y-2 text-xs leading-5 text-slate-600">{advice.thirtyDayActions.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays className="size-4 text-brand" />90天建议</p><ol className="mt-3 space-y-2 text-xs leading-5 text-slate-600">{advice.ninetyDayActions.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400">{advice.disclaimer}</p>
    </SectionCard>
  );
}
