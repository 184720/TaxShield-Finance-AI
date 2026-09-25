import type { TaxDataBundle, TaxHealthReport } from '@/modules/domain/types';
import { runRiskEngine } from '@/modules/risk-engine';

export function recheckReport(previous: TaxHealthReport, data: TaxDataBundle): TaxHealthReport {
  if (!previous.inputSnapshot) throw new Error('该历史记录没有原始数据，无法复检。');
  const current = runRiskEngine(structuredClone(previous.profile), structuredClone(data), previous.dataSource);
  return { ...current, previousReportId: previous.reportId, recheckOfReportId: previous.reportId };
}

