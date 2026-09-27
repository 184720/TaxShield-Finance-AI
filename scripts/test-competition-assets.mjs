import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
const server = await createServer({ configFile: false, server: { middlewareMode: true }, resolve: { alias: {
  '@': fileURLToPath(new URL('../src', import.meta.url)),
  '@lark-apaas/client-toolkit-lite': fileURLToPath(new URL('./test-storage.mjs', import.meta.url)),
} } });
try {
  const { buildDemoCase } = await server.ssrLoadModule('/src/modules/cases/demo-case.ts');
  const { buildMultidimensionalProfile: build } = await server.ssrLoadModule('/src/modules/health-profile/multidimensional-profile.ts');
  const store = await server.ssrLoadModule('/src/lib/taxshield-store.ts');
  const saved = JSON.stringify(store.loadReports());
  const { before, after, diff, readinessAfter } = buildDemoCase();
  assert.equal(before.healthIndex, 89); assert.equal(after.healthIndex, 99);
  assert.equal(diff.resolvedRiskIds.length, 5);
  assert.equal(after.previousReportId, before.reportId);
  assert.equal(readinessAfter.readinessLevel, 'needs-improvement');
  assert.equal(JSON.stringify(store.loadReports()), saved);
  const snapshot = JSON.stringify(before);
  assert.equal(build(before).dimensions.length, 5);
  assert.match(build(before).dimensions[1].value, /%/);
  const sparse = structuredClone(before);
  sparse.inputSnapshot.monthlyTrend = sparse.inputSnapshot.monthlyTrend.slice(0, 1);
  assert.match(build(sparse).dimensions[1].value, /待补充/);
  sparse.inputSnapshot.monthlyTrend = before.inputSnapshot.monthlyTrend.map((m) => ({ ...m, revenue: 100 }));
  assert.match(build(sparse).dimensions[1].value, /0.0%/);
  sparse.inputSnapshot.monthlyTrend[1].month = '2027-01';
  assert.match(build(sparse).dimensions[1].value, /待补充/);
  const step = { id: 's1', riskId: before.risks[0].id, reportId: before.reportId, done: true, content: '测试', createdAt: before.createdAt };
  assert.match(build(before, {}, [step, step, { ...step, id: 'foreign', reportId: 'another' }]).dimensions[3].value, /1\/1/);
  assert.equal(JSON.stringify(before), snapshot);
  const { KNOWLEDGE_ASSETS } = await server.ssrLoadModule('/src/modules/knowledge/knowledge-assets.ts');
  assert.equal(KNOWLEDGE_ASSETS.length, 8);
  assert.ok(KNOWLEDGE_ASSETS.every((a) => a.evidenceFields.length && a.remediationPath.length && a.limitations));
  for (const path of ['CasesPage/CasesPage', 'KnowledgeCenterPage/KnowledgeCenterPage']) {
    const { default: Page } = await server.ssrLoadModule(`/src/pages/${path}.tsx`);
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Page)));
    assert.ok(html.length > 1000); assert.ok(!html.includes('NaN')); assert.ok(!html.includes('undefined'));
  }
  console.log('PASS: 五维画像、缺失/连续月份保护、Checklist隔离与去重、原报告不可变、8类知识资产、新页面渲染、Demo真实引擎89→99/6→1、材料未虚构齐备、历史不被写入');
} finally { await server.close(); }
