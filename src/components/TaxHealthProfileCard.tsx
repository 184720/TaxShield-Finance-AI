import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/TaxShieldPrimitives';
import { buildMultidimensionalProfile } from '@/modules/health-profile/multidimensional-profile';
import { loadChecklists } from '@/lib/taxshield-store';
import { loadMaterialSelections } from '@/modules/financing/financing-store';
import type { TaxHealthReport } from '@/modules/domain/types';

export default function TaxHealthProfileCard({ report, compact = false }: { report: TaxHealthReport | null; compact?: boolean }) {
  if (!report) return null;
  const profile = buildMultidimensionalProfile(report, loadMaterialSelections(report.profile.id, report.reportId), loadChecklists(report.reportId));
  return (
    <SectionCard
      title="企业财税健康画像"
      icon={Activity}
      description="五维观察企业侧准备情况，不参与健康分或风险判定。"
      action={!compact ? <Button asChild size="sm" variant="outline"><Link to="/growth">查看企业成长档案</Link></Button> : undefined}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.dimensions.map((item) => {
          return <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            </div>
            <p className="ts-tabular mt-3 text-lg font-bold text-brand">{item.value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.limit}</p>
          </div>;
        })}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{profile.disclaimer} <Link className="text-brand underline" to="/trust">查看指标口径</Link></p>
    </SectionCard>
  );
}
