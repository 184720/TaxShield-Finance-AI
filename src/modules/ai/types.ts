import type { AIExplanation, RemediationPlan, RiskRecord, TaxHealthReport } from '@/modules/domain/types';

export type { AIExplanation } from '@/modules/domain/types';

export interface AIExplanationRequest {
  reportId: string;
  riskRecord: RiskRecord;
  prompt: string;
}

export interface AIProvider {
  explainRisk(request: AIExplanationRequest): Promise<unknown>;
  generateRemediationPlan(risk: RiskRecord): Promise<RemediationPlan>;
}

/** AI 助手对话上下文（精简版报告，避免泄漏与请求体超限） */
export interface AIChatContext {
  reportId: string;
  enterpriseName: string;
  dataSource: TaxHealthReport['dataSource'];
  healthIndex: number;
  overallLevel: RiskRecord['level'];
  risks: Array<{
    id: string;
    riskName: string;
    category: string;
    level: RiskRecord['level'];
    reason: string;
    evidence: RiskRecord['evidence'];
    suggestion: RiskRecord['suggestion'];
    policyReferences: RiskRecord['policyReferences'];
  }>;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  reportId: string;
  context: AIChatContext;
  question: string;
  history: AIChatMessage[];
}

export interface AIChatResponse {
  answer: string;
  provider: 'qwen';
  model: string;
  generatedAt: string;
}
