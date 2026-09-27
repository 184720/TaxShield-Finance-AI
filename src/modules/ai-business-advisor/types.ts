export interface BusinessAdvisorAdvice {
  reportId: string;
  generatedAt: string;
  currentIssues: string[];
  reasonAnalysis: string[];
  thirtyDayActions: string[];
  ninetyDayActions: string[];
  disclaimer: string;
}
