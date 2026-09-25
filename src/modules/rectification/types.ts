export type RectificationStatus = 'pending' | 'in-progress' | 'completed';

export interface RectificationPlan {
  id: string;
  riskId: string;
  reportId: string;
  summary: string;
  steps: string[];
  requiredMaterials: string[];
  precautions: string[];
  status: RectificationStatus;
  provider: 'qwen' | 'mock';
  model: string;
  generatedAt: string;
}

export interface ChecklistItem {
  id: string;
  riskId: string;
  reportId: string;
  content: string;
  done: boolean;
  createdAt: string;
  completedAt?: string;
}
