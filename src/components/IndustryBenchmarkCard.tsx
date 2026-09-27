import { BarChart3 } from 'lucide-react';
import { SectionCard } from '@/components/TaxShieldPrimitives';
import { buildBenchmarkSnapshot } from '@/modules/benchmark';
import type { TaxHealthReport } from '@/modules/domain/types';

export default function IndustryBenchmarkCard({ report }: { report: TaxHealthReport | null }) {
  if (!report) return null;
  const snapshot = buildBenchmarkSnapshot(report);
  return (
    <SectionCard title="行业智能基准" icon={BarChart3} description={`${snapshot.industryLabel} · 本地模拟基准库，仅供比赛演示自查参考。`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {snapshot.items.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-800">{item.label}</p><span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">演示参考值</span></div>
          <p className="mt-3 text-xs text-slate-400">当前观测</p><p className="ts-tabular mt-1 text-base font-semibold text-slate-800">{item.currentValue}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{item.referenceText}</p>
        </div>)}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400">{snapshot.disclaimer}</p>
    </SectionCard>
  );
}
