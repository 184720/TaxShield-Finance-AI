import type { EnterpriseTaxHealthProfile, HealthProfileInput } from './types';

/**
 * 企业财税健康画像只读取既有报告，作为四维展示层；不参与风险判断或健康指数计算。
 */
export function generateTaxHealthProfile(report: HealthProfileInput): EnterpriseTaxHealthProfile {
  const highRiskCount = report.risks.filter((risk) => risk.level === 'high').length;
  const completed = Object.values(report.remediationStatus ?? {}).filter((status) => status === 'completed').length;
  const started = Object.values(report.remediationStatus ?? {}).filter((status) => status === 'in-progress').length;
  const totalRisks = report.risks.length;

  return {
    reportId: report.reportId,
    enterpriseId: report.profile.id,
    generatedAt: report.createdAt,
    healthIndex: report.healthIndex,
    dimensions: [
      {
        id: 'compliance-stability', label: '当前财税健康状态',
        status: report.healthIndex >= 80 && highRiskCount === 0 && report.dataInsufficiencies.length === 0 ? 'stable' : 'attention',
        value: `${report.healthIndex} / 100 分`,
        description: `仅反映本次输入与规则检测结果，不推断长期稳定性。${highRiskCount > 0 ? '仍有高风险事项需优先核查。' : '请结合风险明细和数据完整度理解当前分数。'}`,
        source: 'Tax Health Index（既有报告）',
      },
      {
        id: 'data-completeness', label: '数据完整度',
        status: report.dataInsufficiencies.length === 0 ? 'stable' : 'attention',
        value: report.dataInsufficiencies.length === 0 ? '检测字段已覆盖' : `${report.dataInsufficiencies.length} 项待补充`,
        description: report.dataInsufficiencies.length === 0 ? '本次规则未发现因数据不足而未执行的项目。' : '部分规则因数据不足未执行，补充数据后应重新检测。',
        source: '规则数据完整性检查（既有报告）',
      },
      {
        id: 'risk-control', label: '风险控制情况',
        status: highRiskCount > 0 ? 'attention' : (report.risks.length > 0 ? 'improving' : 'stable'),
        value: `${highRiskCount} 项高风险 / ${totalRisks} 项风险`,
        description: highRiskCount > 0 ? '仍存在高风险事项，建议按原报告的证据和整改方案优先处理。' : '本次规则未识别高风险事项，仍应结合风险明细持续关注。',
        source: '风险规则引擎输出（既有报告）',
      },
      {
        id: 'remediation-progress', label: '整改完成情况',
        status: totalRisks > 0 && completed < totalRisks ? (started > 0 ? 'improving' : 'attention') : 'stable',
        value: totalRisks === 0 ? '暂无需整改事项' : `${completed} / ${totalRisks} 项已完成 Checklist`,
        description: 'Checklist 仅记录整改执行进度；风险是否解除必须通过修改数据后重新运行规则引擎验证。',
        source: '整改 Checklist 执行状态（既有报告）',
      },
    ],
    disclaimer: '本画像为企业内部财税健康展示，所有结论来自既有报告；不改变风险等级、健康指数或任何金融机构决策。',
  };
}
