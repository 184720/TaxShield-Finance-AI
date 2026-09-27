import { Building2, FileCheck2, ShieldCheck } from 'lucide-react';
import { generateTaxHealthProfile } from '@/modules/health-profile';
import { generateFinancingReadiness } from '@/modules/financing/financing-readiness';
import type { ChecklistItem } from '@/modules/rectification/types';
import type { FinancingMaterialSelections } from '@/modules/financing/types';
import type { TaxHealthReport } from '@/modules/domain/types';

export default function FinancingTaxHealthSummary({ report, selections, checklists }: { report: TaxHealthReport; selections: FinancingMaterialSelections; checklists: ChecklistItem[] }) {
  const health = generateTaxHealthProfile(report);
  const financing = generateFinancingReadiness(report, selections, checklists);
  const pendingMaterials = financing.requiredMaterials.filter((item) => item.status !== 'ready').length;
  return <section className="grid gap-4 md:grid-cols-2">
    <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Building2 className="size-4 text-brand" />企业财税健康摘要</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-400">企业</p><p className="mt-1 font-medium text-slate-800">{report.profile.name}</p></div><div><p className="text-xs text-slate-400">行业</p><p className="mt-1 font-medium text-slate-800">{health.dimensions[0] ? report.profile.industry : '—'}</p></div><div><p className="text-xs text-slate-400">健康状态</p><p className="mt-1 font-medium text-slate-800">{report.healthIndex} / 100</p></div><div><p className="text-xs text-slate-400">风险情况</p><p className="mt-1 font-medium text-slate-800">{report.risks.length} 项（高风险 {report.risks.filter((risk) => risk.level === 'high').length} 项）</p></div></div></div>
    <div className="rounded-2xl border border-brand-100 bg-brand-soft/40 p-5"><p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ShieldCheck className="size-4 text-brand" />准备与整改状态</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-400">整改完成</p><p className="mt-1 font-medium text-slate-800">{health.dimensions.find((item) => item.id === 'remediation-progress')?.value}</p></div><div><p className="text-xs text-slate-400">资料完整</p><p className="mt-1 font-medium text-slate-800"><FileCheck2 className="mr-1 inline size-3.5" />待补充 / 复核 {pendingMaterials} 项</p></div></div><p className="mt-4 text-xs leading-5 text-slate-500">本模块仅用于企业财税健康管理及融资材料准备参考，不代表任何金融机构授信意见。</p></div>
  </section>;
}
