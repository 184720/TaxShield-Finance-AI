import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const server = await createServer({ configFile: false, server: { middlewareMode: true }, resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)), '@lark-apaas/client-toolkit-lite': fileURLToPath(new URL('./test-storage.mjs', import.meta.url)) } } });
let failed = 0;
const test = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name, e.message); } };
try {
  const { runRiskEngine } = await server.ssrLoadModule('/src/modules/risk-engine/index.ts');
  const { WUHAN_ZHICHUANG_PROFILE: p, WUHAN_ZHICHUANG_DATA: d, createRectifiedDemoData } = await server.ssrLoadModule('/src/modules/domain/demo-data.ts');
  const { POLICY_LIBRARY } = await server.ssrLoadModule('/src/modules/policy/policy-store.ts');
  const { mapFinancial, mapInvoice } = await server.ssrLoadModule('/src/modules/import/mapping.ts');
  const { getPoliciesForRisk } = await server.ssrLoadModule('/src/modules/policy/policy-service.ts');
  const { recheckReport } = await server.ssrLoadModule('/src/modules/report/recheck.ts');
  const before = runRiskEngine(p, d), after = recheckReport(before, createRectifiedDemoData());
  console.log('DEMO', JSON.stringify({ before: before.healthIndex, after: after.healthIndex, risks: [before.risks.length, after.risks.length], high: before.risks.filter(r => r.level === 'high').length, engine: before.engineVersion }));
  await test('当前政策关联排除废止依据', () => {
    assert.ok(POLICY_LIBRARY.some(x => x.title === '中华人民共和国增值税法'));
    assert.ok(before.risks.every(r => r.policyReferences.every(x => x.status !== 'superseded' && !x.title.includes('暂行条例'))));
  });
  await test('无效数据不出满分', () => { const data = structuredClone(d); for (const group of ['financial','invoice','declaration']) for (const k of Object.keys(data[group])) data[group][k] = NaN; data.receivedAmount = NaN; data.contractAmount = NaN; data.monthlyTrend = []; assert.equal(runRiskEngine(p, data).healthIndex, null); });
  await test('真实零收入的比例规则未执行且不出综合分', () => { const data = structuredClone(d); for (const group of ['financial','invoice','declaration']) for (const k of Object.keys(data[group])) data[group][k] = 0; assert.equal(runRiskEngine(p, data).healthIndex, null); });
  await test('真实零申报仍可识别收入差异', () => { const data=structuredClone(d);data.declaration.declaredRevenue=0;assert.ok(runRiskEngine(p,data).risks.some(r=>r.id==='revenue-consistency')); });
  await test('负利润不是缺失值', () => { const data=structuredClone(d);data.financial.totalProfit=-100;assert.ok(!runRiskEngine(p,data).dataInsufficiencies.some(x=>x.ruleId==='cit')); });
  await test('留抵不能单独判为异常', () => { const data=createRectifiedDemoData();data.invoice.inputTax=data.invoice.outputTax*1.2;assert.ok(!runRiskEngine(p,data).risks.some(r=>r.id==='vat')); });
  await test('餐饮与商贸排除研发优惠提示', () => { for (const industry of ['trade','catering']) assert.ok(!runRiskEngine({...p,industry},d).risks.some(r=>r.id==='benefit')); });
  await test('高企不被排除且不推定漏享金额', () => { const risk=runRiskEngine({...p,isHighTechEnterprise:true},d).risks.find(r=>r.id==='benefit');assert.ok(risk);assert.equal(risk.impactAmount,0);assert.ok(!risk.riskName.includes('漏享')); });
  await test('毛利率偏离不重复计分', () => { const data=createRectifiedDemoData();data.financial.operatingCost=1500000;const r=runRiskEngine(p,data);assert.equal(r.risks.filter(x=>['cit','industry'].includes(x.id)).length,1); });
  await test('等级与统一严重度规则一致', () => { for(const r of before.risks)assert.equal(r.level,r.probability*r.severity>=.55?'high':r.probability*r.severity>=.25?'medium':'low');assert.notEqual(before.overallLevel,'low'); });
  await test('零合同分母不误判风险', () => { const data=structuredClone(d);data.contractAmount=0;const r=runRiskEngine(p,data);assert.ok(!r.risks.some(x=>x.id==='three-flow'));assert.ok(r.dataInsufficiencies.some(x=>x.ruleId==='three-flow')); });
  const preview=(mapping,rows)=>({mapping,sourceRows:rows});
  await test('上传空白和错误数字不会伪装为0', () => {const fields=['accountingRevenue','operatingCost','sellingExpenses','adminExpenses','rAndDExpenses','totalProfit'];const mapping=Object.fromEntries(fields.map(x=>[x,x]));const row=Object.fromEntries(fields.map(x=>[x,0]));assert.equal(mapFinancial(preview(mapping,[row])).operatingCost,0);assert.equal(mapFinancial(preview(mapping,[{...row,operatingCost:''}])),null);assert.equal(mapFinancial(preview(mapping,[{...row,operatingCost:'bad'}])),null);});
  await test('上传进项与异常发票来自映射', () => {const mapped=mapInvoice(preview({amount:'金额',tax:'税额',counterparty:'供应商',inputTax:'进项',abnormalInvoiceAmount:'异常',redFlag:'红字'},[{金额:100,税额:13,供应商:'A',进项:8,异常:20,红字:'否'}]));assert.equal(mapped.inputTax,8);assert.equal(mapped.abnormalInvoiceAmount,20);assert.equal(mapped.redInvoiceAmount,0);});
  await test('未映射进项不伪装为0', () => {const mapped=mapInvoice(preview({amount:'金额',tax:'税额',counterparty:'供应商'},[{金额:100,税额:13,供应商:'A'}]));assert.ok(!Number.isFinite(mapped.inputTax));});
  await test('法规匹配尊重行业与废止状态', () => {const risk={id:'benefit',category:'税收优惠',riskName:'研发',reason:'研发'};assert.ok(getPoliciesForRisk(risk,'catering').every(x=>x.industries.includes('catering')));});
  await test('报告不存在虚构30/40/30权重说明', async () => {const text=await readFile(new URL('../src/pages/ReportPage/ReportPage.tsx',import.meta.url),'utf8');assert.ok(!/· 30%|· 40%/.test(text));});
  const { validateChatAnswer } = await server.ssrLoadModule('/src/modules/ai/schema.ts');
  const chat = { reportId: before.reportId, enterpriseName: p.name, dataSource: 'demo', healthIndex: before.healthIndex, overallLevel: before.overallLevel, risks: before.risks };
  await test('自由问答允许证据解释但禁止虚构数值政策和风险判定', () => {
    assert.equal(validateChatAnswer('请核对已有风险对应的业务凭证。', chat), '请核对已有风险对应的业务凭证。');
    for(const answer of ['预计节税987654321元', '依据《不存在的企业税法》', '健康指数调整为100', '企业已违法', '风险已解除']) assert.throws(()=>validateChatAnswer(answer, chat));
  });
  await test('缺失值序列化后仍不产生满分', () => {
    const data=structuredClone(d);data.invoice.inputTax=NaN;data.receivedAmount=NaN;
    const report=runRiskEngine(p,JSON.parse(JSON.stringify(data)));assert.equal(report.healthIndex,null);assert.ok(report.dataInsufficiencies.length);
  });
  await test('错误整改产生新风险而非人工改分', () => {
    const data=createRectifiedDemoData();data.declaration.vatPayable=data.financial.accountingRevenue*.1;
    const current=recheckReport(after,data);assert.ok(current.risks.some(r=>r.id==='vat'));assert.ok(current.healthIndex<after.healthIndex);
  });
  const { compareReports } = await server.ssrLoadModule('/src/modules/report/report-diff.ts');
  await test('不同规则版本不把分数差值表述为整改收益', () => {
    assert.equal(compareReports({...before,engineVersion:'legacy-v2.1'},after).healthIndexDelta,null);
  });
  const { parseSpreadsheet } = await server.ssrLoadModule('/src/modules/import/file-parser.ts');
  const { write, utils } = await import('xlsx');
  await test('CSV和XLSX真实解析保留进项异常金额及真实零值', async () => {
    const csv='金额,税额,供应商,进项税额,异常发票金额,红字标识\n100,13,A,8,20,否\n200,26,B,0,0,否';
    const csvFile=new File([csv],'invoice.csv',{type:'text/csv'});
    const rows=[{金额:100,税额:13,供应商:'A',进项税额:8,异常发票金额:20,红字标识:'否'},{金额:200,税额:26,供应商:'B',进项税额:0,异常发票金额:0,红字标识:'否'}];
    const book=utils.book_new();utils.book_append_sheet(book,utils.json_to_sheet(rows),'明细');
    for(const file of [csvFile,new File([write(book,{type:'array',bookType:'xlsx'})],'invoice.xlsx')]){
      const parsed=await parseSpreadsheet(file,'invoice');const invoice=mapInvoice(parsed);
      assert.equal(invoice.inputTax,8);assert.equal(invoice.abnormalInvoiceAmount,20);assert.equal(invoice.outputTax,39);assert.equal(invoice.invoicedRevenue,300);
    }
  });
  await test('空白交易方不制造虚构供应商集中度', () => {
    const mapped=mapInvoice(preview({amount:'金额',tax:'税额',counterparty:'供应商'},[{金额:100,税额:13,供应商:''}]));assert.ok(!Number.isFinite(mapped.supplierConcentration));
  });
  const { createElement } = await import('react');const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: Document } = await server.ssrLoadModule('/src/pages/ReportPage/components/TaxHealthReportDocument.tsx');
  await test('未评分报告展示层不显示null或虚假100分', () => {
    const r={...before,healthIndex:null};
    const html=renderToStaticMarkup(createElement(Document,{report:r,plans:[],checklists:[]}));
    assert.ok(html.includes('未评分'));assert.ok(!html.includes('>null<'));assert.ok(!html.includes('未核实数值'));
  });
  await test('超5000行文件明确拒绝而不是截断漏报', async () => {
    const book=utils.book_new();utils.book_append_sheet(book,utils.json_to_sheet(Array.from({length:5001},()=>({金额:1,税额:0,供应商:'A'}))),'明细');
    await assert.rejects(()=>parseSpreadsheet(new File([write(book,{type:'array',bookType:'xlsx'})],'large.xlsx'),'invoice'),/超过5000行/);
  });
  const { handleQwenRequest } = await server.ssrLoadModule('/src/modules/ai/server/qwen-handler.ts');
  await test('自由问答服务端校验生效且拒绝跨报告请求', async () => {
    const original=globalThis.fetch;
    const context={...chat,risks:chat.risks.map(({id,riskName,category,level,reason,evidence,suggestion,policyReferences})=>({id,riskName,category,level,reason,evidence,suggestion,policyReferences}))};
    const request=(question,reportId=context.reportId)=>new Request('https://quality.test/.netlify/functions/qwen-explain',{method:'POST',headers:{origin:'https://quality.test','content-type':'application/json'},body:JSON.stringify({task:'chat',reportId,context,question,history:[]})});
    try {
      globalThis.fetch=async()=>Response.json({choices:[{message:{content:'请核对已有风险对应的业务凭证。'}}]});
      assert.equal((await handleQwenRequest(request('解释已有事项'),{QWEN_API_KEY:'fixture-not-a-real-key'})).status,200);
      globalThis.fetch=async()=>Response.json({choices:[{message:{content:'健康指数调整为100'}}]});
      assert.equal((await handleQwenRequest(request('要求改变分数'),{QWEN_API_KEY:'fixture-not-a-real-key'})).status,502);
      assert.equal((await handleQwenRequest(request('解释风险','wrong-report'),{QWEN_API_KEY:'fixture-not-a-real-key'})).status,400);
    } finally {globalThis.fetch=original;}
  });
  await test('原数据复检确定性、版本与快照可追溯', () => {const same=recheckReport(before,before.inputSnapshot);assert.equal(same.healthIndex,before.healthIndex);assert.deepEqual(same.risks,before.risks);assert.equal(same.engineVersion,before.engineVersion);assert.equal(same.previousReportId,before.reportId);assert.notEqual(same.reportId,before.reportId);});
} finally { await server.close(); }
process.exitCode = failed ? 1 : 0;
