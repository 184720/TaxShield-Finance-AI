import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle, SectionCard } from '@/components/TaxShieldPrimitives';
import { buildDemoCase } from '@/modules/cases/demo-case';
import { READINESS_LABEL } from '@/modules/financing/types';

export default function CasesPage() {
  const { before, after, diff, readinessBefore, readinessAfter } = useMemo(buildDemoCase, []);
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
    <PageTitle eyebrow="Demo Case" title="企业案例中心" description="Demo案例 · 内置模拟企业与固定测试输入。当前未收录经授权核验的真实客户案例，不代表实际整改或融资成果。" />
    <SectionCard title="案例背景" description={`${before.profile.name}（模拟企业）`}>
      <p className="text-sm leading-7">软件信息服务企业，{before.profile.employeeCount}名员工。以收入口径、费用、发票等模拟差异，展示企业如何形成可理解、可复核的财税健康档案。下列结果由现有引擎现场计算，不写入历史检测。</p>
    </SectionCard>
    <SectionCard title="风险发现"><ul className="list-disc space-y-2 pl-5 text-sm">{before.risks.map((risk) => <li key={risk.id}>{risk.riskName}：{risk.reason}</li>)}</ul></SectionCard>
    <SectionCard title="模拟整改过程" description="这是测试输入变化，不是建议企业为提高分数而改账；真实修正必须有凭证依据。">
      <ol className="list-decimal space-y-2 pl-5 text-sm"><li>核对收入确认、申报及收款口径，模拟修正相应输入。</li><li>模拟调整费用、供应商集中度、发票及进项税额字段；补正末月收入和成本输入。</li><li>使用已有“整改后Demo数据”重新运行原引擎，不勾选虚假的执行记录。</li></ol>
      <p className="mt-3 text-sm">申报收入（元）：{before.inputSnapshot.declaration.declaredRevenue.toLocaleString()} → {after.inputSnapshot.declaration.declaredRevenue.toLocaleString()}；供应商集中度：{(before.inputSnapshot.invoice.supplierConcentration * 100).toFixed(0)}% → {(after.inputSnapshot.invoice.supplierConcentration * 100).toFixed(0)}%。</p>
    </SectionCard>
    <SectionCard title="复检结果" description={`引擎版本：${after.engineVersion}；按父子报告编号关联，分数不是人为加分。`}>
      <div className="grid gap-4 sm:grid-cols-3">{[['健康指数（分）', `${before.healthIndex} → ${after.healthIndex}`], ['风险数量（项）', `${before.risks.length} → ${after.risks.length}`], ['解除 / 仍存 / 新增（项）', `${diff.resolvedRiskIds.length} / ${diff.remainingRiskIds.length} / ${diff.newRiskIds.length}`]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-sm">{label}</p><p className="mt-2 text-xl font-semibold text-brand">{value}</p></div>)}</div>
      <p className="mt-3 text-sm">仍存在：{after.risks.map((risk) => risk.riskName).join('、') || '本次未发现；仍需检查未执行项'}。</p>
    </SectionCard>
    <SectionCard title="融资准备变化"><p className="font-semibold">{READINESS_LABEL[readinessBefore.readinessLevel]} → {READINESS_LABEL[readinessAfter.readinessLevel]}</p><p className="mt-3 text-sm leading-7">{readinessAfter.summary} 本案例未模拟材料全部齐备，不代表真实融资结果或金融机构意见。</p><Link to="/financing" className="mt-3 inline-block text-sm text-brand underline">查看当前企业融资准备中心</Link></SectionCard>
  </main>;
}
