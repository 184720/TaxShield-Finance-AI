export type FinancingReadinessLevel = 'well-prepared' | 'needs-improvement' | 'priority-remediation';
export type FinancingMaterialStatus = 'ready' | 'missing' | 'needs-review';
export type FinancingMaterialCategory = '企业基础资料' | '财务资料' | '纳税资料' | '经营资料' | '融资辅助资料';

export interface FinancingMaterialItem {
  id: string;
  label: string;
  category: FinancingMaterialCategory;
  status: FinancingMaterialStatus;
  source: 'report' | 'self-check';
  note: string;
}
export type FinancingMaterialSelections = Record<string, FinancingMaterialStatus>;
export interface FinancingReadinessReport {
  id: string;
  reportId: string;
  enterpriseId: string;
  taxHealthIndex: number;
  readinessLevel: FinancingReadinessLevel;
  summary: string;
  strengths: string[];
  warnings: string[];
  requiredMaterials: FinancingMaterialItem[];
  recommendedActions: string[];
  disclaimer: string;
  createdAt: string;
}
export const READINESS_LABEL: Record<FinancingReadinessLevel, string> = {
  'well-prepared': '准备较充分',
  'needs-improvement': '建议完善',
  'priority-remediation': '需优先整改',
};
export const MATERIAL_STATUS_LABEL: Record<FinancingMaterialStatus, string> = {
  ready: '已准备', missing: '待补充', 'needs-review': '待复核',
};
export const FINANCING_DISCLAIMER = '本报告仅用于企业内部财税健康管理及融资材料准备参考，不构成任何银行授信、贷款审批、信用评级或金融产品推荐意见。';

