import type { TaxHealthReport } from '../domain/types';

export type HealthProfileDimensionId = 'compliance-stability' | 'data-completeness' | 'risk-control' | 'remediation-progress';
export type HealthProfileStatus = 'stable' | 'attention' | 'improving';

export interface HealthProfileDimension {
  id: HealthProfileDimensionId;
  label: string;
  status: HealthProfileStatus;
  value: string;
  description: string;
  source: string;
}

export interface EnterpriseTaxHealthProfile {
  reportId: string;
  enterpriseId: string;
  generatedAt: string;
  healthIndex: number;
  dimensions: HealthProfileDimension[];
  disclaimer: string;
}

export type HealthProfileInput = Pick<TaxHealthReport, 'reportId' | 'createdAt' | 'profile' | 'healthIndex' | 'risks' | 'dataInsufficiencies' | 'remediationStatus'>;
