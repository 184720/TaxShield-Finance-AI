import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  resolve: { alias: {
    '@': fileURLToPath(new URL('../src', import.meta.url)),
    '@lark-apaas/client-toolkit-lite': fileURLToPath(new URL('./test-storage.mjs', import.meta.url)),
  } },
});

const forbidden = /未核实数值|undefined|null/i;

try {
  const { runRiskEngine } = await server.ssrLoadModule('/src/modules/risk-engine/index.ts');
  const { WUHAN_ZHICHUANG_PROFILE: profile, WUHAN_ZHICHUANG_DATA: data } = await server.ssrLoadModule('/src/modules/domain/demo-data.ts');
  const { validateQwenExplanation, validateQwenRemediation } = await server.ssrLoadModule('/src/modules/ai/schema.ts');
  const storage = await server.ssrLoadModule('/src/lib/taxshield-store.ts');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: Document } = await server.ssrLoadModule('/src/pages/ReportPage/components/TaxHealthReportDocument.tsx');

  const report = runRiskEngine(profile, data, 'demo');
  const risk = report.risks[0];
  const explanationRaw = {
    riskId: risk.id,
    reportId: report.reportId,
    risk_summary: '核对差异金额（¥987654321）对应明细',
    reason_analysis: '分析2099年度变化',
    evidence_explanation: '结合现有证据核对undefined字段',
    possible_impact: '影响范围为null，需结合资料复核',
    suggestion: '核对差异金额（¥987654321）对应明细',
    confidence: 'medium',
    data_gaps: ['分析2099年度变化'],
    evidence_indices: [0],
    policy_ids: [],
  };
  const explanation = validateQwenExplanation(explanationRaw, report.reportId, risk);
  const explanationText = [explanation.summary, explanation.reasonAnalysis, explanation.impact, ...explanation.suggestion].join('\n');
  assert.doesNotMatch(explanationText, forbidden);
  assert.ok(explanation.summary.includes('核对差异金额对应的业务明细'));
  assert.ok(explanation.reasonAnalysis.includes('分析对应期间的业务变化情况'));
  assert.ok(!explanationText.includes('987654321') && !explanationText.includes('2099'));

  const remediationRaw = {
    riskId: risk.id,
    reportId: report.reportId,
    summary: '核对差异金额（¥987654321）对应明细',
    steps: ['分析2099年度变化', '核对undefined字段'],
    requiredMaterials: ['null资料清单'],
    precautions: ['不得补造987654321元业务资料'],
    evidence_indices: [0],
    policy_ids: [],
  };
  const remediation = validateQwenRemediation(remediationRaw, report.reportId, risk);
  const remediationText = [remediation.summary, ...remediation.steps, ...remediation.requiredMaterials, ...remediation.precautions].join('\n');
  assert.doesNotMatch(remediationText, forbidden);
  assert.ok(remediation.summary.includes('核对差异金额对应的业务明细'));
  assert.ok(remediation.steps[0].includes('分析对应期间的业务变化情况'));
  assert.ok(!remediationText.includes('987654321') && !remediationText.includes('2099'));

  const contaminatedExplanation = {
    riskId: risk.id,
    reportId: report.reportId,
    summary: '核对差异金额（¥未核实数值）对应明细',
    reasonAnalysis: '分析未核实数值年度变化',
    evidence: risk.evidence,
    impact: 'undefined',
    suggestion: ['核对null字段'],
    confidence: 0.5,
    disclaimer: '需专业复核',
    provider: 'qwen',
    model: 'qwen-plus',
    generatedAt: report.createdAt,
  };
  storage.saveReport({ ...report, aiExplanationSnapshot: { [risk.id]: contaminatedExplanation } });
  storage.saveRectificationPlan({
    id: `rectification-${report.reportId}-${risk.id}`,
    riskId: risk.id,
    reportId: report.reportId,
    summary: '核对差异金额（¥未核实数值）对应明细',
    steps: ['分析未核实数值年度变化', '核对undefined字段'],
    requiredMaterials: ['null资料清单'],
    precautions: ['不得补造业务资料'],
    status: 'pending',
    provider: 'qwen',
    model: 'qwen-plus',
    generatedAt: report.createdAt,
  });
  const persistedReport = storage.loadReport();
  const plans = storage.loadRectificationPlans(report.reportId);
  const checklists = storage.loadChecklists(report.reportId);
  const checklistText = checklists.map((item) => item.content).join('\n');
  assert.doesNotMatch(checklistText, forbidden);

  const pdfHtml = renderToStaticMarkup(createElement(Document, {
    report: persistedReport,
    plans,
    checklists,
    historyReports: [persistedReport],
  }));
  assert.doesNotMatch(pdfHtml, forbidden);
  assert.ok(pdfHtml.includes('核对差异金额对应的业务明细'));
  assert.ok(pdfHtml.includes('分析对应期间的业务变化情况'));

  console.log('PASS: AI解释、整改方案、Checklist与PDF均使用自然语言且不泄漏占位文本');
} finally {
  await server.close();
}
