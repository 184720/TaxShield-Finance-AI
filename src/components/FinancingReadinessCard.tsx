import { Link } from 'react-router-dom';
import { FolderCheck } from 'lucide-react';
import { Button } from './ui/button';
import { SectionCard } from './TaxShieldPrimitives';
import type { TaxHealthReport } from '@/modules/domain/types';
import { generateFinancingReadiness } from '@/modules/financing/financing-readiness';
import { loadMaterialSelections } from '@/modules/financing/financing-store';
import { READINESS_LABEL } from '@/modules/financing/types';

export default function FinancingReadinessCard({ report }: { report: TaxHealthReport | null }) {
  const result = report ? generateFinancingReadiness(report, loadMaterialSelections(report.profile.id, report.reportId)) : null;
  return (
    <SectionCard title="融资准备" icon={FolderCheck} description="先体检、再整改、再准备融资。">
      {result ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><p className="text-xs text-slate-500">当前状态</p><p className="mt-2 text-xl font-semibold text-brand">{READINESS_LABEL[result.readinessLevel]}</p></div>
            <div><p className="text-xs text-slate-500">财税健康</p><p className="mt-2 text-xl font-semibold">{result.taxHealthIndex} / 100</p></div>
            <div><p className="text-xs text-slate-500">待补充 / 待复核材料</p><p className="mt-2 text-xl font-semibold">{result.requiredMaterials.filter((item) => item.status !== 'ready').length} 项</p></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{result.summary}</p>
          <p className="mt-2 text-xs text-slate-500">依据当前报告；准备状态不代表银行授信或贷款审批结果。</p>
        </>
      ) : <p className="text-sm text-slate-500">完成首次财税检测后，生成融资准备提示与资料自查清单。</p>}
      <Button asChild variant="outline" className="mt-4"><Link to={report ? `/financing?reportId=${encodeURIComponent(report.reportId)}` : '/financing'}>查看融资准备</Link></Button>
    </SectionCard>
  );
}

