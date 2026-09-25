import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const server=await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':fileURLToPath(new URL('../src',import.meta.url))}}});
const originalFetch=globalThis.fetch;
try {
 const risk={id:'vat',category:'增值税',riskName:'增值税负担与抵扣异常',level:'medium',probability:.5,severity:2,impactAmount:120,reason:'进项抵扣需核对',evidence:[{label:'进项税额',value:'100元'}],status:'detected',policyReferences:[{id:'VAT001',title:'演示政策',documentNumber:'演示〔2024〕1号',issuer:'演示',effectiveDate:'2024-01-01',status:'review-required',articleNumber:'第一条',content:'需核对',riskTypes:['vat'],industries:[]}],suggestion:{summary:'核对',steps:['核对原始凭证'],requiredMaterials:['凭证'],precautions:['复核']}};
 const explanation={riskId:'vat',reportId:'report-test',risk_summary:'解释引擎已有提示',reason_analysis:'进项证据需要核对',evidence_explanation:'进项税额为100元',possible_impact:'可能需要进一步核对抵扣资料',suggestion:'建议核对原始凭证',confidence:'medium',data_gaps:[],evidence_indices:[0],policy_ids:['VAT001']};
 const remediation={riskId:'vat',reportId:'report-test',summary:'核验抵扣资料',steps:['核对原始凭证'],requiredMaterials:['凭证'],precautions:['需专业复核'],evidence_indices:[0],policy_ids:['VAT001']};
 let requests=[];
 globalThis.fetch=async(_url,options)=>{const body=JSON.parse(options.body);requests.push(body);return Response.json(body.task==='remediation'?{data:remediation,meta:{provider:'qwen',model:'qwen-plus',generatedAt:'2026-09-19T01:00:00.000Z'}}:{data:explanation,meta:{provider:'qwen',model:'qwen-plus',generatedAt:'2026-09-19T01:00:00.000Z'}})};
 const {explainRisk}=await server.ssrLoadModule('/src/modules/ai/ai-service.ts');
 const online=await explainRisk('report-test',risk);assert.equal(online.provider,'qwen');assert.equal(online.model,'qwen-plus');assert.equal(online.generatedAt,'2026-09-19T01:00:00.000Z');assert.deepEqual(online.evidence,risk.evidence);assert.equal(requests[0].task,'explanation');
 const again=await explainRisk('report-test',risk);assert.deepEqual(again,online);assert.equal(requests.length,1,'same risk must be deduplicated during cooldown');
 const {generateRemediationPlan}=await server.ssrLoadModule('/src/modules/ai/remediation-service.ts');
 const plan=await generateRemediationPlan(risk,'report-test');assert.equal(plan.provider,'qwen');assert.equal(plan.model,'qwen-plus');assert.equal(plan.generatedAt,'2026-09-19T01:00:00.000Z');assert.equal(plan.reportId,'report-test');assert.equal(plan.riskId,'vat');assert.equal(requests[1].task,'remediation');
 const samePlan=await generateRemediationPlan(risk,'report-test');assert.deepEqual(samePlan,plan);assert.equal(requests.length,2,'same remediation must be deduplicated during cooldown');
 globalThis.fetch=async()=>{throw new Error('offline')};
 const fallback=await explainRisk('report-other',risk);assert.equal(fallback.provider,'mock');assert.equal(fallback.model,'fixed-template-v1');assert.ok(Date.parse(fallback.generatedAt));
 const fallbackPlan=await generateRemediationPlan(risk,'report-other');assert.equal(fallbackPlan.provider,'mock');assert.equal(fallbackPlan.model,'fixed-template-v1');assert.ok(Date.parse(fallbackPlan.generatedAt));
 console.log('PASS: default Qwen explanation/remediation metadata, per-risk cooldown, and Mock fallback metadata');
} finally {globalThis.fetch=originalFetch;await server.close();}
