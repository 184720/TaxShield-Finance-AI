import type { RiskEvidence } from '@/modules/domain/types';

export const money = (value: number) => `¥${Math.round(value).toLocaleString('zh-CN')}`;
export const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
export const evidence = (label: string, value: string, comparison?: string): RiskEvidence => ({ label, value, comparison });
