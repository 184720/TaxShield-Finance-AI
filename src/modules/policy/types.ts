import type { Industry } from '@/modules/domain/types';

/** Local, structured policy reference for demo explanations. */
export interface PolicyArticle {
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
