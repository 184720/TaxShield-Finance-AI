import type { Industry, RiskRecord } from '@/modules/domain/types';
import { POLICY_LIBRARY } from './policy-store';
import type { PolicyArticle } from './types';

function keywordsForRisk(risk: RiskRecord) {
  return `${risk.riskName} ${risk.category} ${risk.reason}`.toLowerCase().split(/[，。、\s]+/).filter((item) => item.length >= 2);
}

/** Policy matching is post-detection explanation only; it cannot change a risk decision. */
export function getPoliciesForRisk(riskRecord: RiskRecord, industry?: Industry): PolicyArticle[] {
  const byRiskId = POLICY_LIBRARY.filter((policy) => policy.riskTypes.includes(riskRecord.id));
  if (byRiskId.length) return byRiskId;

  const byCategory = POLICY_LIBRARY.filter((policy) => policy.riskTypes.includes(riskRecord.category));
  if (byCategory.length) return byCategory;

  const keywords = keywordsForRisk(riskRecord);
  return POLICY_LIBRARY.filter((policy) => {
    const content = `${policy.title} ${policy.content}`.toLowerCase();
    return (!industry || policy.industries.includes(industry)) && keywords.some((keyword) => content.includes(keyword));
  }).slice(0, 3);
}
