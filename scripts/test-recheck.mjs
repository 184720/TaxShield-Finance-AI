import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const server = await createServer({ configFile: false, server: { middlewareMode: true }, resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)), '@lark-apaas/client-toolkit-lite': fileURLToPath(new URL('./test-storage.mjs', import.meta.url)) } } });
try {
  const { runRiskEngine } = await server.ssrLoadModule('/src/modules/risk-engine/index.ts');
  const { recheckReport } = await server.ssrLoadModule('/src/modules/report/recheck.ts');
  const { compareReports } = await server.ssrLoadModule('/src/modules/report/report-diff.ts');
  const { WUHAN_ZHICHUANG_PROFILE: profile, WUHAN_ZHICHUANG_DATA: data, createRectifiedDemoData } = await server.ssrLoadModule('/src/modules/domain/demo-data.ts');
  const before = runRiskEngine(profile, data);
  const original = JSON.stringify(before);
  const same = recheckReport(before, before.inputSnapshot);
  const sameDiff = compareReports(before, same);
  assert.equal(same.healthIndex, before.healthIndex);
  assert.deepEqual(same.risks, before.risks);
  assert.deepEqual(sameDiff.resolvedRiskIds, []);
  assert.deepEqual(sameDiff.newRiskIds, []);
  assert.notEqual(same.reportId, before.reportId);
  assert.equal(same.previousReportId, before.reportId);
  assert.equal(same.recheckOfReportId, before.reportId);
  console.log('场景1 PASS', JSON.stringify(sameDiff));

  const correctedInput = createRectifiedDemoData();
  const corrected = recheckReport(before, correctedInput);
  const diff = compareReports(before, corrected);
  assert.deepEqual(new Set(diff.resolvedRiskIds), new Set(['revenue-consistency', 'cit', 'invoice', 'three-flow', 'trend']));
  assert.deepEqual(diff.remainingRiskIds, ['benefit']);
  assert.ok(corrected.healthIndex > before.healthIndex);
  assert.equal(JSON.stringify(before), original);
  correctedInput.invoice.inputTax = 999999;
  assert.notEqual(corrected.inputSnapshot.invoice.inputTax, 999999);
  console.log('场景2 PASS', JSON.stringify(diff));

  const badInput = structuredClone(corrected.inputSnapshot);
  badInput.invoice.inputTax = badInput.invoice.outputTax;
  const bad = recheckReport(corrected, badInput);
  const badDiff = compareReports(corrected, bad);
  assert.deepEqual(badDiff.newRiskIds, ['vat']);
  assert.deepEqual(badDiff.remainingRiskIds, ['benefit']);
  console.log('场景3 PASS', JSON.stringify(badDiff));

  const storage = await server.ssrLoadModule('/src/lib/taxshield-store.ts');
  const { generateRemediationPlan } = await server.ssrLoadModule('/src/modules/ai/remediation-service.ts');
  storage.saveReport(before);
  const persistedRisks = storage.loadReport().risks;
  const risk = before.risks[0];
  storage.saveRectificationPlan(await generateRemediationPlan(risk, before.reportId));
  for (const item of storage.loadChecklists(before.reportId)) storage.toggleChecklistItem(item.id);
  const completed = storage.loadReport();
  assert.equal(completed.remediationStatus[risk.id], 'completed');
  assert.deepEqual(completed.risks, persistedRisks);
  assert.equal(completed.healthIndex, before.healthIndex);
  assert.equal(completed.totalImpactAmount, before.totalImpactAmount);
  const afterChecklist = recheckReport(completed, completed.inputSnapshot);
  assert.ok(compareReports(completed, afterChecklist).remainingRiskIds.includes(risk.id));
  storage.saveReport(afterChecklist);
  assert.ok(storage.loadReportById(before.reportId));
  storage.selectReport(before.reportId);
  assert.equal(storage.loadReport().reportId, before.reportId);
  const item = storage.loadChecklists(before.reportId)[0];
  storage.toggleChecklistItem(item.id);
  assert.equal(storage.loadReport().remediationStatus[risk.id], 'in-progress');
  assert.deepEqual(storage.loadReport().risks, persistedRisks);
  console.log('Checklist 状态隔离、旧报告存档、按 ID 查看 PASS（内存存储适配器）');
} finally { await server.close(); }
