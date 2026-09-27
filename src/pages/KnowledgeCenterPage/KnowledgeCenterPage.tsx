import { PageTitle, SectionCard } from '@/components/TaxShieldPrimitives';
import { KNOWLEDGE_ASSETS } from '@/modules/knowledge/knowledge-assets';

export default function KnowledgeCenterPage() {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
    <PageTitle eyebrow="Knowledge Assets" title="TaxShield知识资产中心" description="八类现有规则的可读说明：条件、字段、解释、整改路径与本地政策参考。不是新增风险引擎或经过实证验证的行业标准。" />
    {KNOWLEDGE_ASSETS.map((asset) => <SectionCard key={asset.id} title={asset.name} description={`规则类别：${asset.id} · 本地维护说明`}>
      <dl className="space-y-3 text-sm leading-6">
        <div><dt className="font-semibold">触发条件</dt><dd>{asset.basis}</dd></div>
        <div><dt className="font-semibold">证据字段</dt><dd className="break-words">{asset.evidenceFields.join(' / ')}</dd></div>
        <div><dt className="font-semibold">解释</dt><dd>{asset.explanation}</dd></div>
        <div><dt className="font-semibold">整改路径</dt><dd><ol className="list-decimal pl-5">{asset.remediationPath.map((step) => <li key={step}>{step}</li>)}</ol></dd></div>
        <div><dt className="font-semibold">政策参考</dt><dd>{asset.policies.length ? asset.policies.map((policy) => <p key={policy.id}>{policy.title} · {policy.documentNumber} · {policy.articleNumber}（库内状态：{policy.status}；适用性待专业复核）</p>) : '本地库暂无该类别直接关联条目，不能据此认定没有适用政策。'}</dd></div>
        <div className="rounded-lg bg-amber-50 p-3"><dt className="font-semibold">适用限制</dt><dd>{asset.limitations}</dd></div>
      </dl>
    </SectionCard>)}
  </main>;
}
