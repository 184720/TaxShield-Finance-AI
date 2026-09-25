import { formatMoney } from '@/components/TaxShieldPrimitives';
import type {
  Industry,
  PolicyDocument,
  RemediationStatus,
  ReportDiff,
  RiskLevel,
  TaxHealthReport,
  TaxpayerType,
} from '@/modules/domain/types';
import type { ChecklistItem, RectificationPlan } from '@/modules/rectification';
import '../report-print.css';
import FinancingReadinessAppendix from './FinancingReadinessAppendix';
import type { FinancingReadinessReport } from '@/modules/financing/types';

const INDUSTRY_LABEL: Record<Industry, string> = {
  software: '软件和信息技术服务业',
  trade: '批发和零售业',
  manufacturing: '制造业',
  catering: '餐饮业',
};

const TAXPAYER_LABEL: Record<TaxpayerType, string> = {
  general: '一般纳税人',
  'small-scale': '小规模纳税人',
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const OVERALL_LABEL: Record<RiskLevel, string> = {
  low: '低风险 · 健康',
  medium: '中风险 · 需关注',
  high: '高风险 · 需整改',
};

const REMEDIATION_LABEL: Record<RemediationStatus, string> = {
  pending: '待整改',
  'in-progress': '整改中',
  completed: '已完成',
};

const POLICY_STATUS_LABEL: Record<PolicyDocument['status'], string> = {
  current: '现行有效',
  superseded: '已失效',
  'review-required': '适用性待复核',
};

export interface TaxHealthReportDocumentProps {
  financing?: FinancingReadinessReport;
  report: TaxHealthReport;
  plans: RectificationPlan[];
  checklists: ChecklistItem[];
  recheck?: { previous: TaxHealthReport; diff: ReportDiff };
  /** 历史检测报告（按时间正序），用于趋势章节；不传则不展示趋势。 */
  historyReports?: TaxHealthReport[];
}

export default function TaxHealthReportDocument({
  report,
  plans,
  checklists,
  recheck,
  historyReports,
  financing,
}: TaxHealthReportDocumentProps) {
  const explanations = report.aiExplanationSnapshot ?? {};
  const createdAt = new Date(report.createdAt).toLocaleString('zh-CN', { hour12: false });
  const explanationEntries = report.risks
    .map((risk) => ({ risk, explanation: explanations[risk.id] }))
    .filter((item) => item.explanation !== undefined);
  const orderedHistory = [...(historyReports ?? [report])].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  const statusOf = (riskId: string): RemediationStatus =>
    plans.find((plan) => plan.riskId === riskId)?.status ??
    report.remediationStatus?.[riskId] ??
    'pending';

  const riskNameById = (id: string) =>
    report.risks.find((risk) => risk.id === id)?.riskName ??
    recheck?.previous.risks.find((risk) => risk.id === id)?.riskName ??
    id;

  const doneItems = checklists.filter((item) => item.done).length;
  const resolvedNames = (recheck?.diff.resolvedRiskIds ?? []).map(riskNameById).join('、');
  const newNames = (recheck?.diff.newRiskIds ?? []).map(riskNameById).join('、');

  return (
    <div className="ts-report">
      {/* 封面 */}
      <section className="ts-page ts-cover">
        <div className="ts-brand">TaxShield AI</div>
        <div className="ts-brand-cn">税智盾</div>
        <div className="ts-cover-title">企业税务健康体检报告</div>
        <div className="ts-cover-sub">面向中小企业的 AI 税务风险自检系统</div>
        <div className="ts-cover-meta">
          <div><span>企业名称</span><strong>{report.profile.name}</strong></div>
          <div><span>检测时间</span><strong>{createdAt}</strong></div>
          <div><span>健康指数</span><strong>{report.healthIndex} / 100</strong></div>
          <div><span>风险等级</span><strong>{OVERALL_LABEL[report.overallLevel]}</strong></div>
          <div><span>数据来源</span><strong>{report.dataSource === 'uploaded' ? '企业上传数据' : '内置演示数据'}</strong></div>
          <div><span>风险事项</span><strong>{report.risks.length} 项 · 影响 {formatMoney(report.totalImpactAmount)}</strong></div>
        </div>
        <div className="ts-cover-ai">
          <span className="ts-ai-tag"><span className="ts-ai-dot" />AI 辅助分析</span>
          <span className="ts-cover-ai-text">风险结论由规则引擎判定 · AI 负责解释、政策溯源与整改建议 · 政策依据来自本地知识库</span>
        </div>
        <div className="ts-cover-foot">报告编号：{report.reportId} · 引擎版本：{report.engineVersion} · 规则版本：{report.ruleVersion}</div>
      </section>

      {/* 企业画像 */}
      <section className="ts-page">
        <h2 className="ts-h2">一、企业画像</h2>
        <table className="ts-kv">
          <tbody>
            <tr><th>企业名称</th><td>{report.profile.name}</td><th>所属行业</th><td>{INDUSTRY_LABEL[report.profile.industry]}</td></tr>
            <tr><th>所在地区</th><td>{report.profile.region}</td><th>纳税人类型</th><td>{TAXPAYER_LABEL[report.profile.taxpayerType]}</td></tr>
            <tr><th>成立年份</th><td>{report.profile.foundedYear}</td><th>员工人数</th><td>{report.profile.employeeCount} 人</td></tr>
            <tr><th>年营业收入</th><td>{formatMoney(report.profile.annualRevenue)}</td><th>主要税种</th><td>{report.profile.mainTaxes.join('、')}</td></tr>
            <tr><th>检测范围</th><td colSpan={3}>财务数据 / 发票数据 / 申报数据 / 月度趋势（数据来源：{report.dataSource === 'uploaded' ? '企业上传数据' : '演示数据'}）</td></tr>
          </tbody>
        </table>
      </section>

      {/* 健康评分 */}
      <section className="ts-page">
        <h2 className="ts-h2">二、健康评分</h2>
        <div className="ts-score">
          <div className="ts-score-big">{report.healthIndex}<span> / 100</span></div>
          <div className="ts-score-grid">
            <div><span>总体等级</span><strong>{OVERALL_LABEL[report.overallLevel]}</strong></div>
            <div><span>风险数量</span><strong>{report.risks.length} 项</strong></div>
            <div><span>潜在影响金额</span><strong>{formatMoney(report.totalImpactAmount)}</strong></div>
          </div>
        </div>
        {report.dataInsufficiencies.length > 0 && (
          <>
            <h3 className="ts-h3">数据不足说明</h3>
            {report.dataInsufficiencies.map((item) => (
              <p key={item.ruleId}>· {item.category}：缺少 {item.requiredFields.join('、')}，未生成风险结论</p>
            ))}
          </>
        )}
      </section>

      {/* 风险清单 */}
      <section className="ts-page">
        <h2 className="ts-h2">三、风险列表与数据证据</h2>
        <table className="ts-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>序号</th>
              <th>风险名称</th>
              <th style={{ width: '13%' }}>风险等级</th>
              <th style={{ width: '13%' }}>风险状态</th>
              <th className="num" style={{ width: '17%' }}>影响金额</th>
            </tr>
          </thead>
          <tbody>
            {report.risks.map((risk, index) => (
              <tr key={risk.id}>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>{risk.riskName}</td>
                <td><span className={`ts-level ts-level-${risk.level}`}>{LEVEL_LABEL[risk.level]}</span></td>
                <td>{REMEDIATION_LABEL[statusOf(risk.id)]}</td>
                <td className="num">{formatMoney(risk.impactAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ts-page-foot">本表风险结论由 Risk Engine 生成，仅作自检参考，具体以主管税务机关为准。</p>
      </section>

      {/* 风险详情（每个风险独立一页） */}
      {report.risks.map((risk, index) => {
        return (
          <section className="ts-page" key={risk.id}>
            <h2 className="ts-h2">三、风险列表与数据证据 · {String(index + 1).padStart(2, '0')}</h2>
            <div className="ts-risk-head">
              <span className={`ts-level ts-level-${risk.level}`}>{LEVEL_LABEL[risk.level]}</span>
              <span className="ts-cat">{risk.category}</span>
              <span className="ts-impact">影响金额 {formatMoney(risk.impactAmount)}</span>
            </div>
            <h3 className="ts-h3" style={{ marginTop: 0 }}>{risk.riskName}</h3>

            <h3 className="ts-h3">风险原因</h3>
            <p>{risk.reason}</p>

            <h3 className="ts-h3">数据证据</h3>
            <table className="ts-table">
              <thead><tr><th>指标</th><th>数值</th><th>对比基准</th></tr></thead>
              <tbody>
                {risk.evidence.map((item) => (
                  <tr key={item.label}><td>{item.label}</td><td>{item.value}</td><td>{item.comparison ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>

            <h3 className="ts-h3">政策依据</h3>
            {risk.policyReferences.map((policy) => (
              <div className="ts-policy" key={policy.id}>
                <p className="ts-policy-doc">《{policy.title}》 · 文号 {policy.documentNumber} · {policy.issuer} · {POLICY_STATUS_LABEL[policy.status]}</p>
                <p>{policy.articleNumber}</p>
                <p>{policy.content}</p>
              </div>
            ))}
            {risk.policyReferences.length === 0 && <p>本地政策库暂未匹配到对应条款。</p>}

          </section>
        );
      })}

      {/* 使用报告中已保存的 AI 解释快照，不在导出时重新请求模型。 */}
      {explanationEntries.map(({ risk, explanation }, index) => explanation && (
        <section className="ts-page" key={`ai-${risk.id}`}>
          <h2 className="ts-h2">四、Qwen AI 风险解释 · {String(index + 1).padStart(2, '0')}</h2>
          <div className="ts-risk-head">
            <span className={`ts-level ts-level-${risk.level}`}>{LEVEL_LABEL[risk.level]}</span>
            <span className="ts-cat">{risk.riskName}</span>
            <span className="ts-ai-tag"><span className="ts-ai-dot" />{explanation.provider === 'qwen' ? 'Qwen 在线生成' : '离线保障结果'}</span>
          </div>
          <div className="ts-ai-panel">
            <h3 className="ts-h3">风险是什么</h3>
            <p>{explanation.summary}</p>
            <h3 className="ts-h3">为什么产生</h3>
            <p>{explanation.reasonAnalysis}</p>
            <h3 className="ts-h3">引用的数据证据</h3>
            <table className="ts-table">
              <thead><tr><th>指标</th><th>数值</th><th>对比基准</th></tr></thead>
              <tbody>
                {explanation.evidence.map((item) => (
                  <tr key={`${risk.id}-${item.label}`}><td>{item.label}</td><td>{item.value}</td><td>{item.comparison ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
            <h3 className="ts-h3">可能影响</h3>
            <p>{explanation.impact}</p>
            <h3 className="ts-h3">建议动作</h3>
            <ol className="ts-step-list">
              {explanation.suggestion.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </div>
          <p className="ts-ai-note">
            <strong>{explanation.provider === 'qwen' ? 'Qwen AI' : '离线保障'} · 置信度 {Math.round(explanation.confidence * 100)}%</strong>
            {' '}· 模型 {explanation.model} · 生成时间 {new Date(explanation.generatedAt).toLocaleString('zh-CN', { hour12: false })}
          </p>
          <p className="ts-disclaimer">AI 生成免责声明：{explanation.disclaimer}</p>
        </section>
      ))}
      {explanationEntries.length === 0 && (
        <section className="ts-page">
          <h2 className="ts-h2">四、Qwen AI 风险解释</h2>
          <div className="ts-empty-note">本次报告尚未保存 AI 风险解释。PDF 导出不会重新调用 Qwen API，请先在风险分析页面生成解释后再次导出。</div>
        </section>
      )}

      {/* AI 助手边界与能力说明 */}
      <section className="ts-page">
        <h2 className="ts-h2">五、AI 助手能力说明</h2>
        <p className="ts-intro">税智盾采用“规则引擎 + AI 辅助”的协作方式。风险结论保持确定性，Qwen AI 负责提高专业信息的理解与整改效率。</p>
        <div className="ts-capability-grid">
          <div><strong>风险解释</strong><span>将 Risk Engine 已识别的风险原因与证据转化为易理解的专业说明。</span></div>
          <div><strong>证据归纳</strong><span>仅使用本次 RiskRecord 中已有的数据证据，不补造企业财税数据。</span></div>
          <div><strong>整改辅助</strong><span>围绕已识别风险形成建议步骤、所需材料与注意事项。</span></div>
          <div><strong>安全边界</strong><span>AI 不参与风险判断，不修改风险等级、健康指数或复检结果。</span></div>
        </div>
        <div className="ts-ai-note">
          <strong>本次报告 AI 解释覆盖：</strong>{explanationEntries.length} / {report.risks.length} 项风险。
          报告直接读取检测时已保存的解释结果，导出过程不会重新调用 Qwen API。
        </div>
        <p className="ts-page-foot">AI 输出仅作风险自检与整改辅助，最终处理方案应由企业财税人员或专业机构结合业务实质复核。</p>
      </section>

      {/* 整改建议与 Checklist */}
      <section className="ts-page">
        <h2 className="ts-h2">六、整改建议与执行清单</h2>
        {report.risks.map((risk) => {
          const plan = plans.find((item) => item.riskId === risk.id);
          const items = checklists.filter((item) => item.riskId === risk.id);
          const suggestion = plan ?? risk.suggestion;
          return (
            <div className="ts-check-risk" key={risk.id}>
              <p className="ts-check-title">{risk.riskName} · {REMEDIATION_LABEL[statusOf(risk.id)]}</p>
              <p>{suggestion.summary}</p>
              <p><strong>操作步骤：</strong>{suggestion.steps.join('；')}</p>
              <p><strong>所需材料：</strong>{suggestion.requiredMaterials.join('、')}</p>
              <p><strong>注意事项：</strong>{suggestion.precautions.join('；')}</p>
              {items.length > 0 && (
                <ul>
                  {items.map((item) => (
                    <li key={item.id} className={item.done ? 'done' : ''}>{item.done ? '✓' : '○'} {item.content}</li>
                  ))}
                </ul>
              )}
              {plan && <p className="ts-plan-meta">方案来源：{plan.provider === 'qwen' ? 'Qwen AI 在线生成' : '离线保障模板'} · {new Date(plan.generatedAt).toLocaleString('zh-CN', { hour12: false })}</p>}
            </div>
          );
        })}
        {checklists.length === 0 && <p className="ts-empty-note">尚未生成整改 Checklist；以上内容为风险引擎随报告保存的基础整改建议。</p>}
        {checklists.length > 0 && <p className="ts-summary">整改进度：已完成 {doneItems} / {checklists.length} 项</p>}
      </section>

      {/* 历史趋势与复检对比 */}
      <section className="ts-page">
          <h2 className="ts-h2">七、历史趋势与复检对比</h2>
          <p className="ts-intro">本章节汇总企业历次检测的健康指数、风险数量与潜在影响金额变化，用于观察合规整改的长期效果。</p>
          <table className="ts-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>序号</th>
                <th style={{ width: '20%' }}>检测时间</th>
                <th style={{ width: '14%' }}>健康指数</th>
                <th style={{ width: '12%' }}>风险数量</th>
                <th style={{ width: '12%' }}>高风险</th>
                <th style={{ width: '18%' }}>潜在影响金额</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {orderedHistory.map((r, i) => (
                <tr key={r.reportId}>
                  <td>{i + 1}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td><strong>{r.healthIndex}</strong></td>
                  <td>{r.risks.length} 项</td>
                  <td>{r.risks.filter((x) => x.level === 'high').length} 项</td>
                  <td className="num">{formatMoney(r.totalImpactAmount)}</td>
                  <td>{r.reportId === report.reportId ? '本次报告' : r.recheckOfReportId ? '复检' : '首次检测'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orderedHistory.length < 2 && <p className="ts-empty-note">当前仅有一次检测记录，完成复检后将显示健康指数与风险数量的变化趋势。</p>}
          {recheck ? (
            <>
              <h3 className="ts-h3">本次复检结果</h3>
          <div className="ts-recheck">
            <div className="ts-recheck-num">整改前<strong>{recheck.diff.healthIndexBefore}</strong></div>
                <div className="ts-recheck-arrow">→</div>
            <div className="ts-recheck-num up">整改后<strong>{recheck.diff.healthIndexAfter}</strong></div>
                <div className="ts-recheck-delta">变化<strong>{recheck.diff.healthIndexDelta > 0 ? '+' : ''}{recheck.diff.healthIndexDelta}</strong></div>
          </div>
              <table className="ts-table ts-diff-table">
                <thead><tr><th>对比指标</th><th>整改前</th><th>整改后</th><th>变化</th></tr></thead>
                <tbody>
                  <tr><td>健康指数</td><td>{recheck.diff.healthIndexBefore}</td><td>{recheck.diff.healthIndexAfter}</td><td>{recheck.diff.healthIndexDelta > 0 ? '+' : ''}{recheck.diff.healthIndexDelta}</td></tr>
                  <tr><td>风险数量</td><td>{recheck.diff.riskCountBefore}</td><td>{recheck.diff.riskCountAfter}</td><td>{recheck.diff.riskCountAfter - recheck.diff.riskCountBefore}</td></tr>
                  <tr><td>高风险数量</td><td>{recheck.diff.highRiskCountBefore}</td><td>{recheck.diff.highRiskCountAfter}</td><td>{recheck.diff.highRiskCountAfter - recheck.diff.highRiskCountBefore}</td></tr>
                  <tr><td>潜在影响金额</td><td>{formatMoney(recheck.diff.impactAmountBefore)}</td><td>{formatMoney(recheck.diff.impactAmountAfter)}</td><td>{formatMoney(recheck.diff.impactAmountAfter - recheck.diff.impactAmountBefore)}</td></tr>
                </tbody>
              </table>
          <p><strong>已解除风险：</strong>{resolvedNames || '无'}</p>
              <p><strong>仍存在风险：</strong>{recheck.diff.remainingRiskIds.map(riskNameById).join('、') || '无'}</p>
          <p><strong>新增风险：</strong>{newNames || '无'}</p>
            </>
          ) : (
            <p className="ts-empty-note">本报告不是复检报告，暂无整改前后对比数据。</p>
          )}
          <p className="ts-page-foot">趋势与对比数据均来自本地保存的历史检测报告；分数和风险变化由复检时重新运行 Risk Engine 得出。</p>
      </section>

      {/* 尾页声明 */}
      {financing && financing.reportId === report.reportId && financing.enterpriseId === report.profile.id && <FinancingReadinessAppendix result={financing} />}
      <p className="ts-page-foot">税智盾 TaxShield AI · 本报告基于企业填报数据与内置规则引擎自动生成，仅供税务风险自查参考，不构成税务鉴证或申报结论。</p>
    </div>
  );
}
