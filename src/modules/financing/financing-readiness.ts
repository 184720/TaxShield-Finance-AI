import type { TaxHealthReport } from '../domain/types';
import type { ChecklistItem } from '../rectification/types';
import { buildFinancingMaterials } from './financing-checklist';
import { FINANCING_DISCLAIMER, type FinancingMaterialSelections, type FinancingReadinessReport } from './types';

// 产品内部准备提示口径，不是金融机构标准；仅单向读取检测结果。
// Checklist 完成情况只影响提示文字，绝不参与准备等级计算。
export function generateFinancingReadiness(
  report: TaxHealthReport,
  selections: FinancingMaterialSelections = {},
  checklists: ChecklistItem[] = [],
): FinancingReadinessReport {
  const materials = buildFinancingMaterials(report, selections);
  const highRisks = report.risks.filter((risk) => risk.level === 'high');
  const outstanding = materials.filter((item) => item.status !== 'ready');
  const coreMissing = materials.some((item) => item.source === 'report' && item.status !== 'ready');
  const readinessLevel = highRisks.length > 0 || report.healthIndex < 80
    ? 'priority-remediation'
    : coreMissing || outstanding.length > 0 || report.dataInsufficiencies.length > 0
      ? 'needs-improvement' : 'well-prepared';
  const warnings = [
    ...(highRisks.length ? [`本次检测仍存在 ${highRisks.length} 项高风险：${highRisks.map((risk) => risk.riskName).join('、')}。建议优先复核后再整理融资申请资料。`] : []),
    ...(report.healthIndex < 80 ? ['财税健康指数低于本工具准备提示参考值 80，建议先核查风险并复检。'] : []),
    ...(outstanding.length ? [`还有 ${outstanding.length} 项材料待补充或复核，不能视为资料齐备。`] : []),
    ...(report.dataInsufficiencies.length ? [`${report.dataInsufficiencies.length} 项检测因数据不足未执行，请补充数据重新检测。`] : []),
    ...(report.dataSource === 'demo' ? ['当前为模拟企业演示数据，准备状态不代表真实企业材料或融资情况。'] : []),
  ];
  const completed = report.risks.filter((risk) => {
    const items = checklists.filter((item) => item.reportId === report.reportId && item.riskId === risk.id);
    return items.length > 0 && items.every((item) => item.done);
  });
  if (completed.length) warnings.push('部分整改已执行，但本次检测风险仍存在；请修改实际数据后复检。Checklist 完成不会改变准备等级。');
  const strengths = [
    ...materials.filter((item) => item.source === 'report' && item.status === 'ready').map((item) => `${item.label}已纳入本次财税健康档案`),
    ...(highRisks.length === 0 ? ['本次规则检测未识别高风险事项（不等于不存在风险）'] : []),
  ];
  const savedAI = report.risks.flatMap((risk) => {
    const explanation = report.aiExplanationSnapshot?.[risk.id];
    return explanation?.riskId === risk.id && explanation.reportId === report.reportId
      ? explanation.suggestion.map((text) => `已有AI整改建议 · ${risk.riskName}：${text}`) : [];
  });
  return {
    id: `financing-${report.reportId}`, reportId: report.reportId, enterpriseId: report.profile.id,
    taxHealthIndex: report.healthIndex, readinessLevel,
    summary: readinessLevel === 'priority-remediation'
      ? '当前应优先核查财税风险，完成数据修正与复检后，再完善融资材料。'
      : readinessLevel === 'needs-improvement'
        ? '可继续整理融资资料；仍需补齐材料或完成复核，形成清晰的企业财税健康档案。'
        : '在本工具自查口径下，财税检测与材料自查准备较充分；资料真实性、时效性和具体受理要求仍需专业复核。',
    strengths, warnings, requiredMaterials: materials,
    recommendedActions: [
      ...highRisks.map((risk) => `优先复核“${risk.riskName}”，按照原有整改方案处理并重新检测。`),
      ...savedAI.slice(0, 3),
      ...outstanding.map((item) => `${item.status === 'missing' ? '补充' : '复核'}${item.label}。`),
      '整理近12个月财务、纳税及经营资料，具体期间和材料要求以实际受理机构要求为准。',
      '完成融资申请前资料自查，核对企业名称、期间、数据口径与原始凭证。',
    ],
    disclaimer: FINANCING_DISCLAIMER, createdAt: new Date().toISOString(),
  };
}

