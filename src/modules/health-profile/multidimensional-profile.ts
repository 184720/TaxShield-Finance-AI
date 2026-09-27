import type { TaxHealthReport } from '../domain/types';
import type { ChecklistItem } from '../rectification/types';
import { generateFinancingReadiness } from '../financing/financing-readiness';
import { READINESS_LABEL, type FinancingMaterialSelections } from '../financing/types';

export const INDICATOR_SYSTEM = [
  { id: 'standardization', label: '财税规范度', method: '呈现本次规则提示及未执行项，不另造评分。', limit: '未发现风险不代表合规认证。' },
  { id: 'stability', label: '经营稳定度', method: '至少3个连续月份收入的变异系数：总体标准差÷均值×100%。', limit: '仅观察输入期间收入波动，不推导长期稳定性；不设好坏阈值。' },
  { id: 'completeness', label: '数据完整度', method: '统计因必要数据不足而未执行的规则数。', limit: '规则可执行不代表原始数据真实、完整或已审计。' },
  { id: 'remediation', label: '整改完成度', method: '当前报告已完成Checklist步骤÷已创建步骤；另列未建清单风险。', limit: '勾选仅表示执行进度，风险解除必须复检。' },
  { id: 'readiness', label: '融资准备度', method: '复用现有融资准备提示与材料自查结果，不新增评分。', limit: '不代表信用评级或任何金融机构授信意见。' },
] as const;

export function buildMultidimensionalProfile(report: TaxHealthReport, selections: FinancingMaterialSelections = {}, checklists: ChecklistItem[] = []) {
  const months = [...report.inputSnapshot.monthlyTrend].sort((a, b) => a.month.localeCompare(b.month));
  const period = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5));
  const usable = report.inputSnapshot.availability?.monthlyTrend !== false && months.length >= 3 && months.every((m, i) =>
    /^\d{4}-(0[1-9]|1[0-2])$/.test(m.month) && Number.isFinite(m.revenue) && m.revenue >= 0 && (!i || period(m.month) - period(months[i - 1].month) === 1));
  let stability = '待补充连续月度数据';
  if (usable) {
    const max = Math.max(...months.map((m) => m.revenue));
    const values = months.map((m) => max ? m.revenue / max : 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    stability = mean ? `收入波动系数 ${(Math.sqrt(values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / values.length) / mean * 100).toFixed(1)}%` : '均值为零，无法计算';
  }
  const items = [...new Map(checklists.filter((item) => item.reportId === report.reportId && report.risks.some((risk) => risk.id === item.riskId)).map((item) => [item.id, item])).values()];
  const done = items.filter((item) => item.done).length;
  const uncovered = report.risks.filter((risk) => !items.some((item) => item.riskId === risk.id)).length;
  const readiness = generateFinancingReadiness(report, selections, items);
  const values = [
    [`${report.risks.length}项待核查`, `高风险${report.risks.filter((risk) => risk.level === 'high').length}项；健康指数仍为${report.healthIndex}/100。`],
    [stability, usable ? `${months[0].month}至${months.at(-1)!.month}，${months.length}个月；不是经营预测。` : '需至少3个连续月份且收入非负、有效；不使用单次分数推断稳定性。'],
    [`${report.dataInsufficiencies.length}项规则未执行`, '按本次检测必要字段口径观察数据缺口。'],
    [items.length ? `${(done / items.length * 100).toFixed(0)}%（${done}/${items.length}步）` : '尚无整改步骤', `另有${uncovered}项风险未创建Checklist。`],
    [READINESS_LABEL[readiness.readinessLevel], `材料自查已准备${readiness.requiredMaterials.filter((item) => item.status === 'ready').length}/${readiness.requiredMaterials.length}项；不证明材料真实有效。`],
  ];
  return { dimensions: INDICATOR_SYSTEM.map((item, i) => ({ ...item, value: values[i][0], detail: values[i][1] })), disclaimer: '五维展示评价不合成为信用分，不替代信用评级，不改变原健康指数。数据来源：本次报告快照、报告绑定Checklist及材料自查。' };
}
