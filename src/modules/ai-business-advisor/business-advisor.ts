import type { TaxHealthReport } from '../domain/types';
import type { BusinessAdvisorAdvice } from './types';

/**
 * 对既有 RiskRecord 和已保存的 AI 解释做安全汇总。它不调用风险引擎、不会新增风险，也不回写报告。
 */
export function generateBusinessAdvisor(report: TaxHealthReport): BusinessAdvisorAdvice {
  const priority = [...report.risks].sort((a, b) => (b.level === 'high' ? 2 : b.level === 'medium' ? 1 : 0) - (a.level === 'high' ? 2 : a.level === 'medium' ? 1 : 0) || b.impactAmount - a.impactAmount).slice(0, 3);
  const issueText = priority.map((risk) => `${risk.riskName}（${risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}）：${risk.reason}`);
  const reasonText = priority.map((risk) => {
    const evidence = risk.evidence.slice(0, 2).map((item) => `${item.label}${item.value}`).join('；');
    return `${risk.riskName}的报告证据：${evidence || '报告未提供可展示证据'}。`;
  });
  const savedSuggestions = priority.flatMap((risk) => report.aiExplanationSnapshot?.[risk.id]?.suggestion?.slice(0, 1) ?? []);
  return {
    reportId: report.reportId, generatedAt: report.createdAt,
    currentIssues: issueText.length ? issueText : ['当前报告未识别需优先处理的风险事项；建议持续更新数据并定期检测。'],
    reasonAnalysis: reasonText.length ? reasonText : ['本建议仅基于当前报告，不包含报告外经营数据或外部判断。'],
    thirtyDayActions: [...savedSuggestions, ...priority.flatMap((risk) => risk.suggestion.steps.slice(0, 1))].slice(0, 3).length
      ? [...savedSuggestions, ...priority.flatMap((risk) => risk.suggestion.steps.slice(0, 1))].slice(0, 3)
      : ['核对本次检测数据口径与原始凭证，建立定期自查节奏。'],
    ninetyDayActions: [
      '完成已启动整改事项的材料归档，并由相关人员复核执行证据。',
      '在数据修正后重新运行原有规则引擎，确认风险是否真实解除。',
      '结合复检报告更新企业财税健康档案与融资准备材料自查状态。',
    ],
    disclaimer: 'AI辅助经营建议仅汇总当前 TaxHealthReport 中已有风险、证据和建议，不新增风险、不改变风险等级、不改变健康指数；需由专业人员复核。',
  };
}
