import type { TaxHealthReport } from '../domain/types';

export const AI_BOUNDARY = {
  responsible: ['解释已有风险和证据', '辅助整理整改建议', '总结已有报告内容'],
  excluded: ['风险判断', '评分修改', '政策裁定'],
  implementation: '风险解释与整改可通过服务端代理调用 Qwen，校验失败或调用失败时可使用 Mock 保障。实际来源以结果标识为准。经营建议助手目前汇总已有结果和本地模板，不是新增的实时模型预测。',
};
export const DATA_SOURCES = [
  { title: '企业上传数据', source: '企业提供的 Excel / CSV及填写数据', boundary: '系统读取和汇总输入，不代表原始凭证真实性已核验。金额单位为人民币元，展示为万元时明确标注；比例以百分比（%）显示。' },
  { title: 'Demo数据', source: '项目内置模拟企业及整改后输入', boundary: '用于流程与回归测试，不代表真实客户经营表现或整改效果。' },
  { title: '演示行业参考数据', source: '本地模拟行业参考库', boundary: '全部为“演示参考值”，不是行业统计、监管阈值或金融机构标准。新增基准视图不回写风险判断。' },
  { title: '本地政策参考数据', source: '项目维护的结构化政策条目', boundary: '展示文件名称、条款及库内状态，不表示已实时核验政策时效或适用性；实际使用需专业复核。' },
];
export const ARCHITECTURE = [
  ['企业输入', '企业画像与财税数据由上传或Demo提供。'],
  ['数据解析', '字段映射与汇总形成 TaxDataBundle。'],
  ['规则引擎', '确定风险、证据和健康分，生成 TaxHealthReport。'],
  ['AI辅助', '风险记录经服务端代理进入Qwen；返回结果接受结构与证据校验。'],
  ['整改与复检', 'Checklist记录执行，修改输入后重新检测，父子报告按编号关联。'],
  ['报告与准备', '展示健康报告、PDF、成长档案及企业侧融资材料准备情况。'],
] as const;

/** 对当前八类规则的说明，不执行规则，也不引入新的阈值。 */
export const RULE_GUIDE = [
  { id: 'revenue-consistency', name: '收入申报一致性差异', basis: '会计收入与申报收入差异率超过现有规则的3%关注值。', source: '财务数据、纳税申报数据', direction: '核对收入确认期间及申报口径。' },
  { id: 'vat', name: '增值税负担与抵扣异常', basis: '税负偏离引擎演示基准，或一般纳税人进项税额高于销项税额的85%。', source: '会计收入、应纳增值税、销项及进项税额', direction: '复核申报、抵扣用途和期间。' },
  { id: 'cit', name: '成本费用与利润结构异常', basis: '毛利率或期间费用率偏离引擎内置演示基准。', source: '收入、成本、销售费用、管理费用、利润', direction: '核对费用凭证与成本归集。' },
  { id: 'invoice', name: '供应商集中及发票异常', basis: '供应商集中度不低于55%，或红字、异常发票金额大于0时提示核查；不等于交易违法。', source: '上传或填报的集中度、红字及异常发票金额', direction: '核对供应商资料和发票原因。' },
  { id: 'industry', name: '行业经营指标偏离', basis: '毛利率偏离风险引擎演示参考区间。', source: '会计收入、营业成本及企业行业', direction: '说明业务结构与成本变化。' },
  { id: 'benefit', name: '研发费用优惠可能漏享', basis: '当前规则在存在研发费用且未标记高新技术企业时提示资格复核；这不是完整的优惠资格判断。', source: '研发费用、企业画像标记', direction: '专业复核适用条件和研发辅助账。' },
  { id: 'three-flow', name: '合同、资金、发票、申报流不一致', basis: '当前计算检查收款与申报收入差额占合同金额的比例是否超过5%，并未逐笔验证全部四流。', source: '合同金额、收款金额、申报收入', direction: '关联原始合同、发票及流水，解释跨期差异。' },
  { id: 'trend', name: '收入成本趋势不匹配', basis: '现有规则检查末两期收入增长超过35%且成本增长低于12%的情况。', source: '输入的多期收入、成本、费用', direction: '复核收入确认与成本结转期间。' },
];

export function getReportRuleExplanations(report: TaxHealthReport) {
  return report.risks.map((risk) => ({
    id: risk.id, name: risk.riskName, basis: risk.reason,
    evidence: risk.evidence.map((item) => ({ ...item })),
    direction: risk.suggestion.summary,
  }));
}
