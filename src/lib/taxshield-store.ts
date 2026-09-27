import { scopedStorage } from '@lark-apaas/client-toolkit-lite';
import { WUHAN_ZHICHUANG_PROFILE } from '@/modules/domain/demo-data';
import type { AIExplanation, AssessmentHistoryItem, EnterpriseProfile, RemediationStatus, TaxHealthReport, UploadPreview } from '@/modules/domain/types';
import type { ChecklistItem, RectificationPlan } from '@/modules/rectification';
import { sanitizeAIExplanationText, sanitizeAITextForDisplay } from '@/modules/ai/text-safety';

const KEYS = { profile: 'taxshield_v2_profile', report: 'taxshield_v2_report', history: 'taxshield_v2_history', uploads: 'taxshield_v2_uploads', rectificationPlans: 'taxshield_v2_rectification_plans', checklists: 'taxshield_v2_checklists' };
const REPORTS_CHANGED_EVENT = 'taxshield:reports-changed';

function load<T>(key: string, fallback: T): T { try { const raw = scopedStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function save(key: string, value: unknown) { try { scopedStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional in demo */ } }

export const loadProfile = () => load<EnterpriseProfile>(KEYS.profile, WUHAN_ZHICHUANG_PROFILE);
export const saveProfile = (profile: EnterpriseProfile) => save(KEYS.profile, profile);
// Migrate old Checklist-derived "resolved" flags without changing detection results.
function normalizeReport(report: TaxHealthReport): TaxHealthReport {
  const aiExplanationSnapshot = report.aiExplanationSnapshot
    ? Object.fromEntries(Object.entries(report.aiExplanationSnapshot).map(([riskId, explanation]) => [riskId, sanitizeAIExplanationText(explanation)]))
    : undefined;
  return { ...report, risks: report.risks.map((risk) => ({ ...risk, status: 'detected' })), aiExplanationSnapshot };
}
export function loadReport(): TaxHealthReport | null {
  const report = load<TaxHealthReport | null>(KEYS.report, null);
  return report ? normalizeReport(report) : null;
}
const REPORTS_KEY = 'taxshield_v2_reports';
export function loadReports(): TaxHealthReport[] {
  const reports = load<TaxHealthReport[]>(REPORTS_KEY, []).map(normalizeReport);
  const current = loadReport();
  return current && !reports.some((r) => r.reportId === current.reportId) ? [...reports, current] : reports;
}
export const loadReportById = (reportId: string) => loadReports().find((r) => r.reportId === reportId) ?? null;
export function selectReport(reportId: string) {
  const report = loadReportById(reportId);
  if (report) save(KEYS.report, report);
}
export const loadHistory = () => load<AssessmentHistoryItem[]>(KEYS.history, []);
export function subscribeReports(listener: () => void) {
  listener();
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(REPORTS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(REPORTS_CHANGED_EVENT, listener);
}
export const loadUploads = () => load<UploadPreview[]>(KEYS.uploads, []);
export const saveUploads = (uploads: UploadPreview[]) => save(KEYS.uploads, uploads);
const normalizeRectificationPlan = (plan: RectificationPlan): RectificationPlan => ({
  ...plan,
  summary: sanitizeAITextForDisplay(plan.summary),
  steps: plan.steps.map((item) => sanitizeAITextForDisplay(item)),
  requiredMaterials: plan.requiredMaterials.map((item) => sanitizeAITextForDisplay(item, '相关业务资料')),
  precautions: plan.precautions.map((item) => sanitizeAITextForDisplay(item)),
});
export const loadRectificationPlans = (reportId?: string) => load<RectificationPlan[]>(KEYS.rectificationPlans, []).map(normalizeRectificationPlan).filter((plan) => !reportId || plan.reportId === reportId);
export const loadChecklists = (reportId?: string) => load<ChecklistItem[]>(KEYS.checklists, []).map((item) => ({ ...item, content: sanitizeAITextForDisplay(item.content) })).filter((item) => !reportId || item.reportId === reportId);
export function saveReport(report: TaxHealthReport) {
  const reports = loadReports();
  save(REPORTS_KEY, [report, ...reports.filter((r) => r.reportId !== report.reportId)]);
  save(KEYS.report, report);
  const item: AssessmentHistoryItem = { id: report.id, createdAt: report.createdAt, enterpriseName: report.profile.name, healthIndex: report.healthIndex, riskCount: report.risks.length, totalImpactAmount: report.totalImpactAmount, reportId: report.id, dataSource: report.dataSource, remediationStatus: report.remediationStatus };
  const history = loadHistory().filter((entry) => entry.reportId !== report.id);
  save(KEYS.history, [item, ...history].slice(0, 12));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(REPORTS_CHANGED_EVENT));
}

export function updateRemediationStatus(riskId: string, status: RemediationStatus) {
  const report = loadReport();
  if (!report) return;
  saveReport({ ...report, remediationStatus: { ...report.remediationStatus, [riskId]: status } });
}

export function saveRectificationPlan(plan: RectificationPlan) {
  plan = normalizeRectificationPlan(plan);
  const plans = loadRectificationPlans();
  save(KEYS.rectificationPlans, [plan, ...plans.filter((item) => item.id !== plan.id)]);

  const existingChecklist = loadChecklists().filter((item) => item.reportId === plan.reportId && item.riskId === plan.riskId);
  if (!existingChecklist.length) {
    const createdAt = new Date().toISOString();
    const allItems = loadChecklists();
    const generated = plan.steps.map((content, index) => ({ id: `check-${plan.id}-${index + 1}`, riskId: plan.riskId, reportId: plan.reportId, content, done: false, createdAt }));
    save(KEYS.checklists, [...allItems, ...generated]);
  }
  updateRectificationState(plan.reportId, plan.riskId);
}

export function toggleChecklistItem(itemId: string) {
  const items = loadChecklists();
  const item = items.find((entry) => entry.id === itemId);
  if (!item) return;
  const now = new Date().toISOString();
  const nextItems = items.map((entry) => entry.id === itemId ? { ...entry, done: !entry.done, completedAt: !entry.done ? now : undefined } : entry);
  save(KEYS.checklists, nextItems);
  updateRectificationState(item.reportId, item.riskId, nextItems);
}

function updateRectificationState(reportId: string, riskId: string, checklistItems = loadChecklists()) {
  const items = checklistItems.filter((item) => item.reportId === reportId && item.riskId === riskId);
  if (!items.length) return;
  const status: RemediationStatus = items.every((item) => item.done) ? 'completed' : items.some((item) => item.done) ? 'in-progress' : 'pending';
  const plans = loadRectificationPlans();
  save(KEYS.rectificationPlans, plans.map((plan) => plan.reportId === reportId && plan.riskId === riskId ? { ...plan, status } : plan));

  const report = loadReport();
  if (!report || report.reportId !== reportId) return;
  saveReport({
    ...report,
    remediationStatus: { ...report.remediationStatus, [riskId]: status },
  });
}

export function saveAIExplanation(explanation: AIExplanation) {
  const report = loadReport();
  if (!report || report.reportId !== explanation.reportId) return;
  saveReport({
    ...report,
    aiExplanationSnapshot: { ...report.aiExplanationSnapshot, [explanation.riskId]: explanation },
  });
}
