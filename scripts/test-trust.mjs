import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const server = await createServer({ configFile: false, server: { middlewareMode: true }, resolve: { alias: {
  '@': fileURLToPath(new URL('../src', import.meta.url)),
  '@lark-apaas/client-toolkit-lite': fileURLToPath(new URL('./test-storage.mjs', import.meta.url)),
} } });
try {
  const { runRiskEngine } = await server.ssrLoadModule('/src/modules/risk-engine/index.ts');
  const { WUHAN_ZHICHUANG_PROFILE: profile, WUHAN_ZHICHUANG_DATA: data } = await server.ssrLoadModule('/src/modules/domain/demo-data.ts');
  const { buildBenchmarkSnapshot, getIndustryBenchmark } = await server.ssrLoadModule('/src/modules/benchmark/benchmark-service.ts');
  const { generateTaxHealthProfile } = await server.ssrLoadModule('/src/modules/health-profile/health-profile.ts');
  const { buildGrowthRecords } = await server.ssrLoadModule('/src/modules/health-profile/growth-records.ts');
  const { getReportRuleExplanations, RULE_GUIDE } = await server.ssrLoadModule('/src/modules/trust/trust-content.ts');
  const report = runRiskEngine(profile, data, 'demo');
  const original = JSON.stringify(report);
  const metric = (r, id) => buildBenchmarkSnapshot(r).items.find((item) => item.id === id);
  assert.match(metric(report, 'invoice-pattern').currentValue, /72\.0%/);
  const sparse = structuredClone(report);
  delete sparse.inputSnapshot.invoice.supplierConcentration;
  sparse.inputSnapshot.financial.accountingRevenue = 0;
  assert.equal(metric(sparse, 'invoice-pattern').dataAvailable, false);
  assert.equal(metric(sparse, 'tax-burden').dataAvailable, false);
  assert.equal(metric(sparse, 'cost-structure').dataAvailable, false);
  sparse.trend = [{ month: '2026-02', revenue: 80 }, { month: '2026-01', revenue: 100 }];
  assert.match(metric(sparse, 'revenue-trend').currentValue, /环比 -20\.0%；波动幅度 20\.0%/);
  sparse.trend[0].month = '2026-03';
  assert.equal(metric(sparse, 'revenue-trend').dataAvailable, false);
  for (const industry of ['software', 'trade', 'manufacturing', 'catering']) {
    assert.ok(getIndustryBenchmark(industry).items.every((item) => item.referenceText.includes('演示参考值') && item.label.includes('%')));
  }
  assert.equal(generateTaxHealthProfile(report).dimensions[0].label, '当前财税健康状态');
  assert.equal(generateTaxHealthProfile(report).dimensions[0].status, 'attention');
  console.log('PASS: 百分比换算、缺失/零分母保护、同口径月度趋势与四行业演示标识');
  const make = (id, time, parent, enterprise = profile.id) => ({ ...report, reportId: id, createdAt: `2026-01-0${time}T00:00:00Z`, profile: { ...profile, id: enterprise }, previousReportId: parent, recheckOfReportId: parent });
  const records = [make('child', 3, 'root'), make('other', 1, undefined, 'another-enterprise'), make('root', 1), make('independent', 2), make('lost', 4, 'absent'), make('cross', 5, 'other'), { ...make('conflict', 6, 'root'), previousReportId: 'independent' }];
  const rows = buildGrowthRecords(records, profile.id);
  assert.equal(rows.length, 6);
  assert.equal(rows.find((r) => r.report.reportId === 'child').parent.reportId, 'root');
  assert.equal(rows.find((r) => r.report.reportId === 'independent').relation, 'initial');
  assert.equal(rows.find((r) => r.report.reportId === 'lost').relation, 'missing');
  assert.equal(rows.find((r) => r.report.reportId === 'cross').parent, undefined);
  assert.equal(rows.find((r) => r.report.reportId === 'conflict').relation, 'conflict');
  assert.equal(buildGrowthRecords([{ ...make('legacy', 2, 'root'), recheckOfReportId: undefined }, make('root', 1)], profile.id)[1].parent.reportId, 'root');
  console.log('PASS: 企业隔离、分支复检、缺失父报告、跨企业引用、冲突关联及旧字段兼容');
  assert.equal(RULE_GUIDE.length, 8);
  assert.deepEqual(getReportRuleExplanations(report)[0].evidence, report.risks[0].evidence);
  assert.equal(JSON.stringify(report), original);
  const { MemoryRouter } = await import('react-router-dom');
  const { default: Trust } = await server.ssrLoadModule('/src/pages/TrustCenterPage/TrustCenterPage.tsx');
  const { default: Growth } = await server.ssrLoadModule('/src/pages/EnterpriseGrowthPage/EnterpriseGrowthPage.tsx');
  const store = await server.ssrLoadModule('/src/lib/taxshield-store.ts');
  const render = (Component) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Component)));
  assert.ok(render(Trust).includes('项目可信中心'));
  assert.ok(render(Growth).includes('尚无企业成长记录'));
  console.log('PASS: 无报告页面渲染');
  store.saveReport(report);
  const html = render(Trust);
  assert.ok(html.includes(report.risks[0].riskName));
  assert.ok(html.includes('政策裁定'));
  console.log('PASS: 可信中心当前报告渲染，规则证据保持原值；成长关系由专项测试验证');
} finally { await server.close(); }
