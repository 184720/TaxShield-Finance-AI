import { Link } from 'react-router-dom';
import { PageTitle, SectionCard } from '@/components/TaxShieldPrimitives';
import { loadProfile, loadReport } from '@/lib/taxshield-store';
import { AI_BOUNDARY, ARCHITECTURE, DATA_SOURCES, RULE_GUIDE, getReportRuleExplanations } from '@/modules/trust/trust-content';
import { INDICATOR_SYSTEM } from '@/modules/health-profile/multidimensional-profile';

export default function TrustCenterPage() {
  const selected = loadReport();
  const report = selected?.profile.id === loadProfile().id ? selected : null;
  const explanations = report ? getReportRuleExplanations(report) : [];
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
    <PageTitle eyebrow="Trust Center" title="项目可信中心" description="说明系统如何使用数据、形成风险提示及验证整改，帮助理解现有能力与边界。" />
    <SectionCard title="指标体系说明" description="五维展示不合成新总分，不替代信用评级；原健康指数和复检算法保持不变。">
      <div className="grid gap-4 sm:grid-cols-2">{INDICATOR_SYSTEM.map((item) => <article key={item.id} className="rounded-xl border p-4"><h3 className="font-semibold">{item.label}</h3><p className="mt-2 text-sm leading-6">{item.method}</p><p className="mt-2 text-sm text-slate-600">限制：{item.limit}</p></article>)}</div>
    </SectionCard>
    <SectionCard title="规则资产说明"><p className="text-sm leading-7">把现有八类规则的条件、证据字段、解释、整改路径及政策参考整理成可读资产。知识页面只做说明，不执行新规则。可追溯性来自报告编号、引擎版本、输入快照及风险证据；不宣称专利、独家模型或已验证的行业壁垒。规则覆盖度、专业复核与真实样本验证仍需持续积累。</p><Link className="mt-3 inline-block text-sm text-brand underline" to="/knowledge">查看知识资产中心</Link></SectionCard>
    <SectionCard title="数据治理说明"><ul className="list-disc space-y-2 pl-5 text-sm leading-7"><li>区分企业上传、Demo、演示行业参考与本地政策数据，不将模拟案例标为真实客户。</li><li>画像与材料自查按企业及报告编号关联；浏览器本地隔离不等于服务端多租户权限控制。</li><li>上传内容应取得企业授权并尽量去除无关敏感字段；调用在线AI会向模型服务商传输相关风险信息。</li><li>本地留存不代表已提供加密存储、备份或审计认证。真实推广前仍需完善授权、保存期限、删除机制与安全评估。</li></ul><Link className="mt-3 inline-block text-sm text-brand underline" to="/cases">查看明确标注来源的案例</Link></SectionCard>
    <SectionCard title="技术架构与数据流" description="React + TypeScript展示与本地规则计算；Netlify Function代理模型调用；报告主要保存在当前浏览器。">
      <ol className="grid gap-3 md:grid-cols-3">{ARCHITECTURE.map(([title, detail], index) => <li key={title} className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold text-brand">{index + 1}. {title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></li>)}</ol>
      <p className="mt-4 text-sm leading-6 text-slate-600">调用在线AI时，相关风险证据与政策参考会经本项目服务端发给模型服务商。API密钥由服务端读取。浏览器报告留存不等于已建立云端档案备份。</p>
    </SectionCard>
    <SectionCard title="AI能力边界">
      <div className="grid gap-4 sm:grid-cols-2"><div><h3 className="font-semibold text-brand">AI负责</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{AI_BOUNDARY.responsible.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3 className="font-semibold text-brand">AI不负责</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{AI_BOUNDARY.excluded.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{AI_BOUNDARY.implementation}</p><p className="mt-2 text-sm text-slate-600">结构与证据校验能够约束输出格式和引用来源，但不能保证语义、因果解释与政策适用判断无误。</p>
    </SectionCard>
    <SectionCard title="数据来源与单位"><div className="grid gap-4 sm:grid-cols-2">{DATA_SOURCES.map((item) => <div key={item.title} className="rounded-xl border p-4"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm text-brand">{item.source}</p><p className="mt-2 text-sm leading-6 text-slate-600">{item.boundary}</p></div>)}</div></SectionCard>
    <SectionCard title="风险规则说明" description="以下为当前程序规则摘要。关注阈值和模拟基准不等于法定违规标准；缺少必要数据时规则未执行，不能视为无风险。">
      <div className="grid gap-4 md:grid-cols-2">{RULE_GUIDE.map((rule) => <article key={rule.id} className="rounded-xl border p-4"><h3 className="font-semibold">{rule.name}</h3><p className="mt-2 text-sm leading-6">判断依据：{rule.basis}</p><p className="mt-2 text-sm leading-6 text-slate-600">证据来源：{rule.source}</p><p className="mt-2 text-sm leading-6 text-slate-600">整改方向：{rule.direction}</p></article>)}</div>
      <p className="mt-4 text-sm leading-6 text-slate-600">健康指数（0–100分）是当前规则的汇总结果，不是统计验证的合规概率或信用评级。潜在影响金额单位为人民币元，现有汇总未证明已消除不同事项之间的重复影响，不能直接视作实际损失。</p>
    </SectionCard>
    <SectionCard title="当前报告证据" description={report ? `${report.profile.name} · ${report.reportId} · 引擎 ${report.engineVersion}` : '当前企业尚未选择检测报告。'}>
      {explanations.map((item) => <article key={item.id} className="mb-4 rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">{item.name}</h3><p className="mt-2 text-sm">判断说明：{item.basis}</p><ul className="mt-2 space-y-1 text-sm">{item.evidence.map((entry, index) => <li key={index}>{entry.label}：{entry.value}{entry.comparison ? `（${entry.comparison}）` : ''}</li>)}</ul><p className="mt-2 text-sm">整改方向：{item.direction}</p></article>)}
      {report && !explanations.length && <p className="text-sm">本次未生成风险记录，请同时检查是否存在数据不足项。</p>}
      <Link className="text-sm text-brand underline" to={report ? '/risk-analysis' : '/upload'}>{report ? '查看风险分析' : '进入数据上传'}</Link>
    </SectionCard>
    <SectionCard title="复检机制"><p className="text-sm leading-7">原始报告快照 → 修改企业输入 → 重新运行同一风险引擎 → 生成新报告 → 按父报告编号比较。Checklist仅表示执行进度，不能修改风险等级或分数。父报告必须属于同一企业；缺失或关联冲突时不生成虚构对比。</p><p className="mt-3 text-sm leading-7">89→99是内置Demo输入变化后的程序测试结果，不代表真实企业整改成效。融资准备结果仅供企业资料准备参考，不代表金融机构授信意见。</p><Link className="mt-3 inline-block text-sm text-brand underline" to="/growth">查看企业成长档案</Link></SectionCard>
  </main>;
}
