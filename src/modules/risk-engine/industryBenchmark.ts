import type { Industry } from '@/modules/domain/types';

export interface IndustryBenchmark { grossMargin: [number, number]; expenseRatio: [number, number]; vatBurden: [number, number]; }

export const INDUSTRY_BENCHMARKS: Record<Industry, IndustryBenchmark> = {
  software: { grossMargin: [45, 75], expenseRatio: [18, 38], vatBurden: [3, 8] },
  trade: { grossMargin: [8, 25], expenseRatio: [4, 18], vatBurden: [1, 5] },
  manufacturing: { grossMargin: [15, 40], expenseRatio: [8, 25], vatBurden: [2, 7] },
  catering: { grossMargin: [35, 65], expenseRatio: [20, 45], vatBurden: [2, 6] },
};
