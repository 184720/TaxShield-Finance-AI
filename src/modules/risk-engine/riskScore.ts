import type { RiskLevel, RiskRecord } from '@/modules/domain/types';

export function calculateHealthIndex(risks: RiskRecord[]) {
  const deduction = risks.reduce((sum, risk) => sum + risk.severity * risk.probability * Math.min(14, 4 + risk.impactAmount / 80_000), 0);
  const healthIndex = Math.max(0, Math.min(100, Math.round(100 - deduction)));
  const overallLevel: RiskLevel = healthIndex >= 80 ? 'low' : healthIndex >= 60 ? 'medium' : 'high';
  return { healthIndex, overallLevel, totalImpactAmount: risks.reduce((sum, risk) => sum + risk.impactAmount, 0) };
}
