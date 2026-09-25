import type { ReportDiff, TaxHealthReport } from '@/modules/domain/types';

export function compareReports(previous: TaxHealthReport, current: TaxHealthReport): ReportDiff {
  const before = new Set(previous.risks.map(r => r.id));
  const after = new Set(current.risks.map(r => r.id));
  return {
    previousReportId: previous.reportId, currentReportId: current.reportId,
    healthIndexBefore: previous.healthIndex, healthIndexAfter: current.healthIndex,
    healthIndexDelta: current.healthIndex - previous.healthIndex,
    riskCountBefore: before.size, riskCountAfter: after.size,
    highRiskCountBefore: previous.risks.filter(r => r.level === 'high').length,
    highRiskCountAfter: current.risks.filter(r => r.level === 'high').length,
    impactAmountBefore: previous.totalImpactAmount, impactAmountAfter: current.totalImpactAmount,
    resolvedRiskIds: [...before].filter(id => !after.has(id)),
    remainingRiskIds: [...before].filter(id => after.has(id)),
    newRiskIds: [...after].filter(id => !before.has(id)),
  };
}

