import { WUHAN_ZHICHUANG_PROFILE, WUHAN_ZHICHUANG_DATA, createRectifiedDemoData } from '../domain/demo-data';
import { runRiskEngine } from '../risk-engine';
import { recheckReport } from '../report/recheck';
import { compareReports } from '../report/report-diff';
import { generateFinancingReadiness } from '../financing/financing-readiness';

// 仅在案例页内计算，不写入企业档案，不伪造Checklist或材料已齐备状态。
export function buildDemoCase() {
  const before = runRiskEngine(structuredClone(WUHAN_ZHICHUANG_PROFILE), structuredClone(WUHAN_ZHICHUANG_DATA), 'demo');
  const after = recheckReport(before, createRectifiedDemoData());
  return { before, after, diff: compareReports(before, after), readinessBefore: generateFinancingReadiness(before), readinessAfter: generateFinancingReadiness(after) };
}
