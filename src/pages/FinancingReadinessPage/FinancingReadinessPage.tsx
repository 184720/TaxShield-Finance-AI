import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, ClipboardCheck, FolderCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/TaxShieldPrimitives';
import { loadChecklists, loadProfile, loadReportById, loadReports, selectReport } from '@/lib/taxshield-store';
import { generateFinancingReadiness } from '@/modules/financing/financing-readiness';
import { loadMaterialSelections, saveMaterialSelections } from '@/modules/financing/financing-store';
import { MATERIAL_STATUS_LABEL, READINESS_LABEL } from '@/modules/financing/types';
import type { FinancingMaterialStatus } from '@/modules/financing/types';
import type { TaxHealthReport } from '@/modules/domain/types';
import FinancingTaxHealthSummary from '@/components/FinancingTaxHealthSummary';

export default function FinancingReadinessPage() {
  const [params] = useSearchParams();
  const requestedId = params.get('reportId');
  const enterpriseId = loadProfile().id;
  const latest = loadReports().filter((item) => item.profile.id === enterpriseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const report = requestedId ? loadReportById(requestedId) : latest;
  if (!report) return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-10">
      <h1 className="text-2xl font-semibold text-brand">小微企业融资准备中心</h1>
      <p>{requestedId ? '未找到指定报告，请从历史检测重新选择。' : '尚无检测报告，请先完成企业财税健康体检。'}</p>
      <Button asChild><Link to="/upload">进入数据上传</Link></Button>
    </main>
  );
  const newestForEnterprise = loadReports().filter((item) => item.profile.id === report.profile.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return <FinancingContent key={report.reportId} report={report} latest={newestForEnterprise} />;
}

function FinancingContent({ report, latest }: { report: TaxHealthReport; latest?: TaxHealthReport }) {
  const [selections, setSelections] = useState(() => loadMaterialSelections(report.profile.id, report.reportId));
  const [saveError, setSaveError] = useState(false);
  const result = generateFinancingReadiness(report, selections, loadChecklists(report.reportId));
  const categories = [...new Set(result.requiredMaterials.map((item) => item.category))];
  function updateMaterial(id: string, status: FinancingMaterialStatus) {
    const next = { ...selections, [id]: status };
    setSelections(next);
    setSaveError(!saveMaterialSelections(report.profile.id, report.reportId, next));
  }
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <section className="rounded-2xl bg-brand p-6 text-white md:p-8">
        <p className="text-xs text-blue-200">TaxShield AI · 普惠金融场景</p>
        <h1 className="mt-2 text-3xl font-semibold">小微企业融资准备中心</h1>
        <p className="mt-3 text-blue-100">企业侧财税健康与材料准备自查，不代表任何金融机构授信意见。</p>
        <p className="mt-5 flex items-center gap-2"><Building2 className="size-4" />{report.profile.name}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div><p className="text-xs text-blue-200">当前财税健康指数</p><p className="mt-2 text-3xl font-semibold">{result.taxHealthIndex} / 100</p></div>
          <div><p className="text-xs text-blue-200">融资准备状态</p><p className="mt-2 text-2xl font-semibold">{READINESS_LABEL[result.readinessLevel]}</p></div>
          <div><p className="text-xs text-blue-200">资料待补充 / 复核</p><p className="mt-2 text-3xl font-semibold">{result.requiredMaterials.filter((item) => item.status !== 'ready').length} 项</p></div>
        </div>
        <p className="mt-5 text-sm leading-6 text-blue-100">{result.summary}</p>
      </section>
      <p className="break-all text-xs leading-5 text-slate-500">依据报告：{report.reportId} · 检测时间：{new Date(report.createdAt).toLocaleString('zh-CN')} · {report.dataSource === 'demo' ? '演示数据，非真实企业融资结论' : '企业上传检测数据'}</p>
      <FinancingTaxHealthSummary report={report} selections={selections} checklists={loadChecklists(report.reportId)} />
      {latest && latest.reportId !== report.reportId && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">当前查看历史报告的准备情况；企业已有更新检测。<Link className="ml-2 underline" to={`/financing?reportId=${encodeURIComponent(latest.reportId)}`}>查看最新报告的融资准备</Link></div>}
      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="当前优势" icon={ClipboardCheck}><ul className="space-y-3 text-sm text-slate-600">{result.strengths.map((text) => <li key={text}>✓ {text}</li>)}{result.strengths.length === 0 && <li>请先补齐企业资料并完成检测。</li>}</ul></SectionCard>
        <SectionCard title="需优先处理" icon={Info}><ul className="space-y-3 text-sm leading-6 text-slate-600">{result.warnings.map((text) => <li key={text}>{text}</li>)}{result.warnings.length === 0 && <li>资料自查已完成，请继续复核真实性、时效性及具体受理要求。</li>}</ul></SectionCard>
      </div>
      <SectionCard title="融资材料清单" icon={FolderCheck} description="检测字段由报告读取；其他资料由企业自行确认，系统不核验文件。每份报告分别保存自查状态，复检后需重新确认。">
        {saveError && <p role="alert" className="mb-4 text-sm text-red-700">本地保存失败，当前选择仅在本页有效，请检查浏览器存储权限。</p>}
        <div className="grid gap-5 md:grid-cols-2">
          {categories.map((category) => <div key={category} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-brand">{category}</h3>
            {result.requiredMaterials.filter((item) => item.category === category).map((item) => <div key={item.id} className="mt-4 border-t border-slate-100 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={item.source === 'self-check' ? `material-${item.id}` : undefined} className="text-sm font-medium">{item.label}</label>
                {item.source === 'self-check' ? <select id={`material-${item.id}`} value={item.status} onChange={(event) => updateMaterial(item.id, event.target.value as FinancingMaterialStatus)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-blue-600">
                  {Object.entries(MATERIAL_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select> : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{MATERIAL_STATUS_LABEL[item.status]}</span>}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
            </div>)}
          </div>)}
        </div>
      </SectionCard>
      <SectionCard title="融资准备建议 · AI辅助整改衔接" description="整理已有AI整改结果与资料缺口；本页不额外调用AI，也不生成贷款判断。">
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">{result.recommendedActions.map((text, index) => <li key={index}>{text}</li>)}</ol>
      </SectionCard>
      <SectionCard title="下一步金融服务" description="产品构想 / 后续接口方向">
        <p className="text-sm leading-7 text-slate-600">完成财税健康和融资资料准备后，企业可根据实际需求进一步了解银行普惠金融服务。未来可探索与商业银行普惠金融服务场景衔接，当前未接入银行接口，也不存在银行合作或官方推荐关系。</p>
      </SectionCard>
      <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600"><summary className="cursor-pointer font-medium">准备等级说明</summary><p className="mt-3">本工具内部提示口径：检测仍有高风险或健康指数低于80时为“需优先整改”；无高风险且指数不低于80，但资料未齐或规则因数据不足未执行时为“建议完善”；上述条件均已满足时为“准备较充分”。不是银行标准。Checklist仅用于显示整改执行提示，不参与等级计算。</p></details>
      <div className="flex flex-wrap gap-3">
        <Button asChild><Link to="/report" onClick={() => selectReport(report.reportId)}>查看健康报告 / 导出PDF</Link></Button>
        <Button asChild variant="outline"><Link to={`/recheck/${report.reportId}`}>开始复检</Link></Button>
      </div>
      <p className="rounded-xl bg-slate-100 p-4 text-xs leading-6 text-slate-500">{result.disclaimer}</p>
    </main>
  );
}
