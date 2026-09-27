import type { TaxHealthReport } from '../domain/types';

/** 仅构造展示关系，不修改存储字段或复检算法。 */
export function buildGrowthRecords(reports: TaxHealthReport[], enterpriseId: string) {
  const own = reports.filter((report) => report.profile.id === enterpriseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.reportId.localeCompare(b.reportId));
  const byId = new Map(own.map((report) => [report.reportId, report]));
  return own.map((report) => {
    const parentReportId = report.recheckOfReportId ?? report.previousReportId;
    const conflict = Boolean(report.recheckOfReportId && report.previousReportId && report.recheckOfReportId !== report.previousReportId);
    const candidate = parentReportId ? byId.get(parentReportId) : undefined;
    const parent = !conflict && candidate && candidate.reportId !== report.reportId && candidate.createdAt <= report.createdAt ? candidate : undefined;
    return { report, parentReportId, parent, relation: conflict ? 'conflict' : parent ? 'linked' : parentReportId ? 'missing' : 'initial' };
  });
}
