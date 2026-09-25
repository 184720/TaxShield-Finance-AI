import type { DataSource, EnterpriseProfile, TaxDataBundle, TaxHealthReport } from '@/modules/domain/types';
import { evaluateRiskRules } from './riskRules';
import { calculateHealthIndex } from './riskScore';
import { getPoliciesForRisk } from '@/modules/policy';

export function runRiskEngine(profile: EnterpriseProfile, data: TaxDataBundle, dataSource: DataSource = 'demo'): TaxHealthReport {
  const evaluation = evaluateRiskRules(profile, data);
  const risks = evaluation.risks.map((risk) => ({
    ...risk,
    // Explanation enrichment happens after rule evaluation; it cannot change a risk decision.
    policyReferences: getPoliciesForRisk(risk, profile.industry),
  }));
  const score = calculateHealthIndex(risks);
  const reportId = `report-${crypto.randomUUID()}`;
  return {
    id: reportId,
    reportId,
    createdAt: new Date().toISOString(),
    profile: structuredClone(profile),
    risks,
    dataInsufficiencies: evaluation.dataInsufficiencies,
    inputSnapshot: structuredClone(data),
    trend: structuredClone(data.monthlyTrend),
    dataSource,
    ruleVersion: 'v2.1',
    engineVersion: 'risk-engine-v2.1',
    remediationStatus: {},
    ...score,
  };
}
