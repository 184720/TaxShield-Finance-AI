import type { RiskLevel, RiskRecord } from '@/modules/domain/types';

export function calculateHealthIndex(risks: RiskRecord[], dataInsufficient = false) {
  const deduction = risks.reduce((sum, risk) => sum + risk.severity * risk.probability * Math.min(14, 4 + risk.impactAmount / 80_000), 0);
  const healthIndex = dataInsufficient ? null : Math.max(0, Math.min(100, Math.round(100 - deduction)));
  const scoreLevel: RiskLevel = healthIndex === null ? 'medium' : healthIndex >= 80 ? 'low' : healthIndex >= 60 ? 'medium' : 'high';
  const overallLevel: RiskLevel = risks.some(r => r.level === 'high') ? 'high' : risks.some(r => r.level === 'medium') && scoreLevel === 'low' ? 'medium' : scoreLevel;
  return { healthIndex, overallLevel, totalImpactAmount: risks.reduce((sum, risk) => sum + risk.impactAmount, 0) };
}
