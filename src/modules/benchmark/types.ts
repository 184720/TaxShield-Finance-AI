import type { Industry } from '../domain/types';

export type BenchmarkMetricId = 'tax-burden' | 'invoice-pattern' | 'revenue-trend' | 'cost-structure';

export interface BenchmarkReferenceItem {
  id: BenchmarkMetricId;
  label: string;
  referenceLabel: '演示参考值';
  referenceText: string;
  note: string;
}

export interface IndustryBenchmark {
  industry: Industry;
  industryLabel: string;
  source: '本地模拟基准库（比赛演示）';
  items: BenchmarkReferenceItem[];
  disclaimer: string;
}

export interface BenchmarkSnapshotItem extends BenchmarkReferenceItem {
  currentValue: string;
  dataAvailable: boolean;
}

export interface BenchmarkSnapshot {
  reportId: string;
  industryLabel: string;
  items: BenchmarkSnapshotItem[];
  disclaimer: string;
}
