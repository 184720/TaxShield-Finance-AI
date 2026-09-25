import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const server = await createServer({
  configFile: false, server: { middlewareMode: true },
  resolve: { alias: {
    '@': fileURLToPath(new URL('../src', import.meta.url)),
    '@lark-apaas/client-toolkit-lite': fileURLToPath(new URL('./test-storage.mjs', import.meta.url)),
  } },
});
try {
  const { runRiskEngine } = await server.ssrLoadModule('/src/modules/risk-engine/index.ts');
  const { recheckReport } = await server.ssrLoadModule('/src/modules/report/recheck.ts');
  const { WUHAN_ZHICHUANG_PROFILE: profile, WUHAN_ZHICHUANG_DATA: data, createRectifiedDemoData } = await server.ssrLoadModule('/src/modules/domain/demo-data.ts');
  const { generateFinancingReadiness: generate } = await server.ssrLoadModule('/src/modules/financing/financing-readiness.ts');
  const { SELF_CHECK_MATERIALS } = await server.ssrLoadModule('/src/modules/financing/financing-checklist.ts');
  const { loadMaterialSelections, saveMaterialSelections } = await server.ssrLoadModule('/src/modules/financing/financing-store.ts');
  const before = runRiskEngine(profile, data, 'demo');
  const original = JSON.stringify(before);
  const allReady = Object.fromEntries(SELF_CHECK_MATERIALS.map((item) => [item.id, 'ready']));
  const first = generate(before);
  assert.equal(before.healthIndex, 89);
  assert.equal(before.risks.length, 6);
  assert.equal(before.risks.filter((risk) => risk.level === 'high').length, 2);
  assert.equal(first.readinessLevel, 'priority-remediation');
  console.log('场景1 PASS: 89 / 6 / 2 → 需优先整改');

  const after = recheckReport(before, createRectifiedDemoData());
  assert.equal(after.healthIndex, 99);
  assert.equal(after.risks.length, 1);
  assert.equal(generate(after).readinessLevel, 'needs-improvement');
  assert.equal(generate(after, allReady).readinessLevel, 'well-prepared');
  console.log('场景2 PASS: 99 / 1 → 建议完善；资料自查确认齐备后 → 准备较充分');

  const missing = structuredClone(after);
  delete missing.inputSnapshot.financial.accountingRevenue;
  missing.profile.name = '';
  const gaps = generate(missing, allReady);
  assert.equal(gaps.readinessLevel, 'needs-improvement');
  assert.equal(gaps.requiredMaterials.find((item) => item.id === 'financial-data').status, 'missing');
  assert.equal(gaps.requiredMaterials.find((item) => item.id === 'profile').status, 'missing');
  assert.ok(gaps.warnings.some((text) => text.includes('材料待补充')));
  assert.equal(generate(after, { ...allReady, license: 'needs-review' }).readinessLevel, 'needs-improvement');
  console.log('场景3 PASS: 缺少数据 / 基础信息 / 待复核资料 → 提示材料缺口');

  const checks = before.risks.map((risk) => ({ id: risk.id, riskId: risk.id, reportId: before.reportId, content: '已执行', done: true, createdAt: before.createdAt }));
  const checked = generate(before, allReady, checks);
  assert.equal(checked.readinessLevel, 'priority-remediation');
  assert.ok(checked.warnings.some((text) => text.includes('整改已执行')));
  assert.equal(JSON.stringify(before), original);
  console.log('场景4 PASS: Checklist 全完成 + 未复检 → 仍需优先整改，原报告完全不变');

  assert.equal(saveMaterialSelections(profile.id, before.reportId, allReady), true);
  assert.deepEqual(loadMaterialSelections(profile.id, before.reportId), allReady);
  assert.deepEqual(loadMaterialSelections('other-enterprise', before.reportId), {});
  assert.deepEqual(loadMaterialSelections(profile.id, after.reportId), {});
  console.log('资料保存 / 企业隔离 / 报告隔离 PASS');

  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: Document } = await server.ssrLoadModule('/src/pages/ReportPage/components/TaxHealthReportDocument.tsx');
  const { default: Appendix } = await server.ssrLoadModule('/src/pages/ReportPage/components/FinancingReadinessAppendix.tsx');
  const props = { report: before, plans: [], checklists: [], historyReports: [before] };
  const base = renderToStaticMarkup(createElement(Document, props));
  const expanded = renderToStaticMarkup(createElement(Document, { ...props, financing: first }));
  const appendix = renderToStaticMarkup(createElement(Appendix, { result: first }));
  assert.ok(expanded.includes('附录 · 融资准备建议'));
  assert.equal(expanded.replace(appendix, ''), base);
  assert.ok(!base.includes('附录 · 融资准备建议'));
  assert.equal(renderToStaticMarkup(createElement(Document, { ...props, financing: { ...first, reportId: 'other' } })), base);
  console.log('PDF内容回归 PASS: 附录可选，移除附录后原报告HTML逐字一致；错配报告拒绝附加');
} finally { await server.close(); }

