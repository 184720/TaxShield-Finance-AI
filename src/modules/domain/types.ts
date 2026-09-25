export type Industry = 'software' | 'trade' | 'manufacturing' | 'catering';
export type TaxpayerType = 'general' | 'small-scale';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface EnterpriseProfile {
  id: string;
  name: string;
  industry: Industry;
  region: string;
  taxpayerType: TaxpayerType;
  employeeCount: number;
  annualRevenue: number;
  foundedYear: number;
  mainTaxes: string[];
  isHighTechEnterprise?: boolean;
}

export interface FinancialData {
  accountingRevenue: number;
  operatingCost: number;
  sellingExpenses: number;
  adminExpenses: number;
  rAndDExpenses: number;
  totalProfit: number;
}

export interface InvoiceData {
  invoicedRevenue: number;
  outputTax: number;
  inputTax: number;
  supplierConcentration: number;
  redInvoiceAmount: number;
  abnormalInvoiceAmount: number;
}

export interface TaxDeclarationData {
  declaredRevenue: number;
  vatPayable: number;
  corporateIncomeTaxPayable: number;
}

export interface MonthlyTrendData {
  month: string;
  revenue: number;
  cost: number;
  expenses: number;
}

export interface RiskEvidence {
  label: string;
  value: string;
  comparison?: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  documentNumber: string;
  issuer: string;
  effectiveDate: string;
  status: 'current' | 'review-required' | 'superseded';
  articleNumber: string;
  content: string;
  riskTypes: string[];
  industries: Industry[];
}

export type DataSource = 'demo' | 'uploaded';
export type RemediationStatus = 'pending' | 'in-progress' | 'completed';

export interface UploadPreview {
  id: string;
  kind: 'financial' | 'invoice' | 'declaration';
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: Array<Record<string, string | number | null>>;
  sourceRows: Array<Record<string, string | number | null>>;
  mapping: Record<string, string>;
  missingFields: string[];
  rowCount: number;
}

export interface RuleDataInsufficiency {
  ruleId: string;
  category: string;
  requiredFields: string[];
  dataInsufficient: true;
}

export interface RemediationPlan {
  summary: string;
  steps: string[];
  requiredMaterials: string[];
  precautions: string[];
}

export interface RiskRecord {
  id: string;
  category: string;
  riskName: string;
  level: RiskLevel;
  probability: number;
  severity: number;
  impactAmount: number;
  reason: string;
  evidence: RiskEvidence[];
  status: 'detected';
  policyReferences: PolicyDocument[];
  suggestion: RemediationPlan;
}

export interface TaxDataBundle {
  financial: FinancialData;
  invoice: InvoiceData;
  declaration: TaxDeclarationData;
  receivedAmount: number;
  contractAmount: number;
  monthlyTrend: MonthlyTrendData[];
  availability?: {
    receivedAmount?: boolean;
    contractAmount?: boolean;
    monthlyTrend?: boolean;
  };
}

export interface TaxHealthReport {
  previousReportId?: string;
  recheckOfReportId?: string;
  id: string;
  reportId: string;
  createdAt: string;
  profile: EnterpriseProfile;
  healthIndex: number;
  overallLevel: RiskLevel;
  totalImpactAmount: number;
  risks: RiskRecord[];
  dataInsufficiencies: RuleDataInsufficiency[];
  inputSnapshot: TaxDataBundle;
  trend: MonthlyTrendData[];
  dataSource: DataSource;
  ruleVersion: string;
  engineVersion: string;
  aiExplanationSnapshot?: Record<string, AIExplanation>;
  remediationStatus?: Record<string, RemediationStatus>;
}

export interface AIExplanation {
  riskId: string;
  reportId: string;
  summary: string;
  reasonAnalysis: string;
  evidence: RiskEvidence[];
  impact: string;
  suggestion: string[];
  confidence: number;
  disclaimer: string;
  provider: 'qwen' | 'mock';
  model: string;
  generatedAt: string;
}

export interface AssessmentHistoryItem {
  highRiskCount?: number;
  previousReportId?: string;
  recheckOfReportId?: string;
  id: string;
  createdAt: string;
  enterpriseName: string;
  healthIndex: number;
  riskCount: number;
  totalImpactAmount: number;
  reportId: string;
  dataSource?: DataSource;
  remediationStatus?: Record<string, RemediationStatus>;
}

export interface ReportDiff {
  previousReportId: string;
  currentReportId: string;
  healthIndexBefore: number;
  healthIndexAfter: number;
  healthIndexDelta: number;
  riskCountBefore: number;
  riskCountAfter: number;
  highRiskCountBefore: number;
  highRiskCountAfter: number;
  impactAmountBefore: number;
  impactAmountAfter: number;
  resolvedRiskIds: string[];
  remainingRiskIds: string[];
  newRiskIds: string[];
}
