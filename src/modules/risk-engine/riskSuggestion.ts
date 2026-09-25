import type { RemediationPlan } from '@/modules/domain/types';

export const remediation = (summary: string, steps: string[], materials: string[]): RemediationPlan => ({
  summary,
  steps,
  requiredMaterials: materials,
  precautions: ['本系统为演示性辅助分析，申报前请由具备资质的专业人员复核。', '政策适用性应以申报期内有效的官方文件为准。'],
});
