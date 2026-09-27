import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
});

try {
  const { runRiskEngine } = await server.ssrLoadModule('/src/modules/risk-engine/index.ts');
  const { recheckReport } = await server.ssrLoadModule('/src/modules/report/recheck.ts');
  const { WUHAN_ZHICHUANG_PROFILE: profile, WUHAN_ZHICHUANG_DATA: data, createRectifiedDemoData } = await server.ssrLoadModule('/src/modules/domain/demo-data.ts');
  const { generateTaxHealthProfile } = await server.ssrLoadModule('/src/modules/health-profile/health-profile.ts');
  const { getIndustryBenchmark, buildBenchmarkSnapshot } = await server.ssrLoadModule('/src/modules/benchmark/benchmark-service.ts');
  const { generateBusinessAdvisor } = await server.ssrLoadModule('/src/modules/ai-business-advisor/business-advisor.ts');

  const first = runRiskEngine(profile, data, 'demo');
  const original = JSON.stringify(first);
  const healthProfile = generateTaxHealthProfile(first);
  assert.equal(healthProfile.reportId, first.reportId);
  assert.equal(healthProfile.dimensions.length, 4);
  assert.ok(healthProfile.dimensions.some((item) => item.id === 'risk-control' && item.status === 'attention'));
  assert.equal(JSON.stringify(first), original);
  console.log('健康画像 PASS: 基于既有报告生成四维展示，不改写健康分或风险记录');

  const benchmark = getIndustryBenchmark(profile.industry);
  assert.equal(benchmark.industry, 'software');
  assert.equal(benchmark.items.length, 4);
  assert.ok(benchmark.items.every((item) => item.referenceLabel === '演示参考值'));
  const snapshot = buildBenchmarkSnapshot(first);
  assert.equal(snapshot.reportId, first.reportId);
  assert.equal(snapshot.items.length, 4);
  assert.ok(snapshot.disclaimer.includes('演示参考'));
  console.log('行业基准 PASS: 本地模拟基准均标记为演示参考值，不宣称真实行业统计');

  const advisor = generateBusinessAdvisor(first);
  assert.equal(advisor.reportId, first.reportId);
  assert.ok(advisor.currentIssues.length > 0);
  assert.ok(advisor.thirtyDayActions.length > 0);
  assert.ok(advisor.ninetyDayActions.length > 0);
  assert.ok(advisor.disclaimer.includes('不改变'));
  assert.equal(JSON.stringify(first), original);
  console.log('经营建议 PASS: 只汇总既有风险与证据，不新增或改写风险结论');

  const rechecked = recheckReport(first, createRectifiedDemoData());
  const improved = generateTaxHealthProfile(rechecked);
  assert.equal(rechecked.healthIndex, 99);
  assert.equal(improved.reportId, rechecked.reportId);
  assert.ok(improved.dimensions.find((item) => item.id === 'risk-control').status !== 'attention');
  console.log('复检兼容 PASS: 89→99仍由原规则引擎计算，新画像仅读取新报告');
} finally {
  await server.close();
}
