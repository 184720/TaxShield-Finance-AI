import type { ITaxFormData } from '@/data/testdata';
import { MOCK_SUGGESTIONS, type ISuggestion } from '@/data/suggestions';

export interface IRiskIndicator {
  id: number;
  name: string;
  value: number;
  unit: string;
  level: 'normal' | 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  policyBasis: string;
  difficulty: 'easy' | 'medium' | 'hard';
  threshold: string;
}

export interface ITaxBenefit {
  policyName: string;
  eligible: boolean;
  estimatedSaving: number;
  description: string;
}

export interface IRiskResult {
  overallScore: number;
  overallLevel: 'low' | 'medium' | 'high';
  overallLevelText: string;
  indicators: IRiskIndicator[];
  benefits: ITaxBenefit[];
}

const INDICATOR_NAMES = [
  '增值税税负率异常',
  '开票收入与申报收入差异',
  '企业所得税毛利率异常',
  '期间费用占比异常',
  '收入成本变动不匹配',
  '小规模免税临界点异常',
  '小微企业所得税优惠适配校验',
  '进项与收入变动配比异常',
];

function getSuggestion(id: number): ISuggestion | undefined {
  return MOCK_SUGGESTIONS.find((s) => s.id === id);
}

/**
 * 计算所有风险指标
 */
export function calculateRisk(data: ITaxFormData): IRiskResult {
  const indicators: IRiskIndicator[] = [];

  // 1. 增值税税负率
  const vatPayable = Math.max(
    0,
    (data.invoicedRevenue + data.uninvoicedRevenue) * 0.01 - data.inputTax,
  );
  const taxBurdenRate =
    data.operatingRevenue > 0
      ? (vatPayable / data.operatingRevenue) * 100
      : 0;
  const taxBurdenNormal = 1; // 小规模 1%
  const taxBurdenDeviation =
    taxBurdenNormal > 0
      ? Math.abs(taxBurdenRate - taxBurdenNormal) / taxBurdenNormal
      : 0;
  const taxBurdenLevel: IRiskIndicator['level'] =
    taxBurdenDeviation > 0.5
      ? 'high'
      : taxBurdenDeviation > 0.2
        ? 'medium'
        : 'normal';
  const sug1 = getSuggestion(1);
  indicators.push({
    id: 1,
    name: INDICATOR_NAMES[0],
    value: Number(taxBurdenRate.toFixed(2)),
    unit: '%',
    level: taxBurdenLevel,
    description:
      taxBurdenLevel === 'normal'
        ? '增值税税负率处于行业正常区间，金税四期预警风险低。'
        : `税负率${taxBurdenRate > taxBurdenNormal ? '偏高' : '偏低'}，偏离正常区间${(taxBurdenDeviation * 100).toFixed(0)}%，可能触发预警。`,
    suggestion: sug1?.suggestion ?? '',
    policyBasis: sug1?.policyBasis ?? '',
    difficulty: sug1?.difficulty ?? 'medium',
    threshold: '正常约1%，偏离±20%为异常',
  });

  // 2. 开票收入与申报收入差异
  const declaredRevenue = data.invoicedRevenue + data.uninvoicedRevenue;
  const invoiceDiffRate =
    data.invoicedRevenue > 0
      ? ((declaredRevenue - data.invoicedRevenue) / data.invoicedRevenue) * 100
      : 0;
  const invoiceDiffLevel: IRiskIndicator['level'] =
    Math.abs(invoiceDiffRate) > 15
      ? 'high'
      : Math.abs(invoiceDiffRate) > 5
        ? 'medium'
        : 'normal';
  const sug2 = getSuggestion(2);
  indicators.push({
    id: 2,
    name: INDICATOR_NAMES[1],
    value: Number(invoiceDiffRate.toFixed(2)),
    unit: '%',
    level: invoiceDiffLevel,
    description:
      invoiceDiffLevel === 'normal'
        ? '开票收入与申报收入差异在合理范围内。'
        : `差异率达${Math.abs(invoiceDiffRate).toFixed(2)}%，金税四期自动比对时可能触发预警。`,
    suggestion: sug2?.suggestion ?? '',
    policyBasis: sug2?.policyBasis ?? '',
    difficulty: sug2?.difficulty ?? 'easy',
    threshold: '差异率绝对值 > 5% 为异常',
  });

  // 3. 企业所得税毛利率
  const grossMargin =
    data.operatingRevenue > 0
      ? ((data.operatingRevenue - data.operatingCost) / data.operatingRevenue) *
        100
      : 0;
  let grossMarginLevel: IRiskIndicator['level'] = 'normal';
  if (grossMargin < 5 || grossMargin > 60) grossMarginLevel = 'high';
  else if (grossMargin < 10 || grossMargin > 50) grossMarginLevel = 'medium';
  const sug3 = getSuggestion(3);
  indicators.push({
    id: 3,
    name: INDICATOR_NAMES[2],
    value: Number(grossMargin.toFixed(2)),
    unit: '%',
    level: grossMarginLevel,
    description:
      grossMarginLevel === 'normal'
        ? '毛利率处于行业合理区间。'
        : grossMargin < 10
          ? '毛利率偏低，易被怀疑隐匿收入或虚增成本。'
          : '毛利率偏高，可能存在成本费用未入账情况。',
    suggestion: sug3?.suggestion ?? '',
    policyBasis: sug3?.policyBasis ?? '',
    difficulty: sug3?.difficulty ?? 'medium',
    threshold: '10% - 50% 为正常区间',
  });

  // 4. 期间费用占比
  const periodExpenseRatio =
    data.operatingRevenue > 0
      ? ((data.sellingExpenses + data.adminExpenses) / data.operatingRevenue) *
        100
      : 0;
  const expenseLevel: IRiskIndicator['level'] =
    periodExpenseRatio > 50
      ? 'high'
      : periodExpenseRatio > 40
        ? 'medium'
        : 'normal';
  const sug4 = getSuggestion(4);
  indicators.push({
    id: 4,
    name: INDICATOR_NAMES[3],
    value: Number(periodExpenseRatio.toFixed(2)),
    unit: '%',
    level: expenseLevel,
    description:
      expenseLevel === 'normal'
        ? '期间费用占比合理。'
        : `费用占比达${periodExpenseRatio.toFixed(2)}%，过高易被判定为虚列费用。`,
    suggestion: sug4?.suggestion ?? '',
    policyBasis: sug4?.policyBasis ?? '',
    difficulty: sug4?.difficulty ?? 'medium',
    threshold: '占比 > 40% 为高风险',
  });

  // 5. 收入成本变动不匹配（简化：毛利率与行业均值对比 + 利润是否合理）
  const industryAvgMargin =
    data.industry === 'service' ? 35 : data.industry === 'trade' ? 15 : 25;
  const marginDeviation = Math.abs(grossMargin - industryAvgMargin) / industryAvgMargin;
  const costMatchLevel: IRiskIndicator['level'] =
    marginDeviation > 0.6 ? 'high' : marginDeviation > 0.3 ? 'medium' : 'normal';
  const sug5 = getSuggestion(5);
  indicators.push({
    id: 5,
    name: INDICATOR_NAMES[4],
    value: Number((marginDeviation * 100).toFixed(2)),
    unit: '%',
    level: costMatchLevel,
    description:
      costMatchLevel === 'normal'
        ? '收入与成本配比关系正常。'
        : `毛利率与行业均值偏差${(marginDeviation * 100).toFixed(0)}%，收入成本变动可能不匹配。`,
    suggestion: sug5?.suggestion ?? '',
    policyBasis: sug5?.policyBasis ?? '',
    difficulty: sug5?.difficulty ?? 'hard',
    threshold: `行业均值约${industryAvgMargin}%，偏差>30%为异常`,
  });

  // 6. 小规模免税临界点异常
  const nearThreshold =
    data.operatingRevenue >= 290000 && data.operatingRevenue <= 305000;
  const thresholdLevel: IRiskIndicator['level'] = nearThreshold ? 'high' : 'normal';
  const sug6 = getSuggestion(6);
  indicators.push({
    id: 6,
    name: INDICATOR_NAMES[5],
    value: Number((data.operatingRevenue / 10000).toFixed(2)),
    unit: '万元',
    level: thresholdLevel,
    description: nearThreshold
      ? '季度收入接近30万免税临界点，为重点监控对象。'
      : '收入距免税临界点较远，无临界值异常风险。',
    suggestion: sug6?.suggestion ?? '',
    policyBasis: sug6?.policyBasis ?? '',
    difficulty: sug6?.difficulty ?? 'easy',
    threshold: '29万-30.5万区间标记高风险',
  });

  // 7. 小微企业所得税优惠适配校验
  const taxableIncome = Math.max(0, data.totalProfit);
  const meetsIncome = taxableIncome <= 3000000;
  const meetsEmployees = data.employeeCount <= 300;
  const meetsAssets = data.totalAssets <= 5000;
  const isSmallMicro = meetsIncome && meetsEmployees && meetsAssets;
  const smallMicroLevel: IRiskIndicator['level'] = isSmallMicro ? 'normal' : 'medium';
  const sug7 = getSuggestion(7);
  indicators.push({
    id: 7,
    name: INDICATOR_NAMES[6],
    value: isSmallMicro ? 1 : 0,
    unit: isSmallMicro ? '符合条件' : '不符合',
    level: smallMicroLevel,
    description: isSmallMicro
      ? '企业符合小型微利企业条件，可享受所得税优惠政策。'
      : `不符合小微企业条件：${[
          !meetsIncome && '应纳税所得额超标',
          !meetsEmployees && '从业人数超标',
          !meetsAssets && '资产总额超标',
        ]
          .filter(Boolean)
          .join('、')}。`,
    suggestion: sug7?.suggestion ?? '',
    policyBasis: sug7?.policyBasis ?? '',
    difficulty: sug7?.difficulty ?? 'medium',
    threshold: '应纳税所得额≤300万 且 从业人数≤300人 且 资产总额≤5000万',
  });

  // 8. 进项与收入变动配比（简化：进项税额占收入比例）
  const inputRatio =
    data.operatingRevenue > 0
      ? (data.inputTax / data.operatingRevenue) * 100
      : 0;
  // 小规模纳税人进项不可抵扣，比例应接近0；若有大额进项则异常
  let inputRatioLevel: IRiskIndicator['level'] = 'normal';
  if (data.inputTax > 0 && inputRatio > 5) inputRatioLevel = 'high';
  else if (data.inputTax > 0 && inputRatio > 2) inputRatioLevel = 'medium';
  const sug8 = getSuggestion(8);
  indicators.push({
    id: 8,
    name: INDICATOR_NAMES[7],
    value: Number(inputRatio.toFixed(2)),
    unit: '%',
    level: inputRatioLevel,
    description:
      inputRatioLevel === 'normal'
        ? '进项税额与收入比例合理。'
        : `进项占收入比例达${inputRatio.toFixed(2)}%，小规模纳税人存在异常进项需核实。`,
    suggestion: sug8?.suggestion ?? '',
    policyBasis: sug8?.policyBasis ?? '',
    difficulty: sug8?.difficulty ?? 'hard',
    threshold: '小规模纳税人进项占比 > 2% 需关注',
  });

  // 综合评分：每项异常扣分，高风险扣15分，中风险扣8分，低风险扣3分，正常不扣
  let scoreDeduction = 0;
  indicators.forEach((ind) => {
    if (ind.level === 'high') scoreDeduction += 15;
    else if (ind.level === 'medium') scoreDeduction += 8;
    else if (ind.level === 'low') scoreDeduction += 3;
  });
  const overallScore = Math.max(0, Math.min(100, 100 - scoreDeduction));
  const overallLevel: IRiskResult['overallLevel'] =
    overallScore >= 80 ? 'low' : overallScore >= 50 ? 'medium' : 'high';
  const overallLevelText =
    overallLevel === 'low' ? '低风险' : overallLevel === 'medium' ? '中风险' : '高风险';

  // 税费优惠适配
  const benefits: ITaxBenefit[] = [];

  // 小规模增值税减免
  const quarterlyRevenue = data.operatingRevenue;
  if (quarterlyRevenue <= 300000) {
    benefits.push({
      policyName: '小规模纳税人增值税减免（季度30万以下免征）',
      eligible: true,
      estimatedSaving: quarterlyRevenue * 0.01, // 按1%征收率计算减免
      description: '季度销售额未超过30万元，免征增值税。',
    });
  } else {
    benefits.push({
      policyName: '小规模纳税人增值税减免（减按1%征收）',
      eligible: true,
      estimatedSaving: quarterlyRevenue * 0.02, // 3%降至1%，减免2%
      description: '季度销售额超过30万元，减按1%征收率征收增值税。',
    });
  }

  // 小型微利企业所得税优惠
  if (isSmallMicro) {
    const actualTax = taxableIncome * 0.25 * 0.2; // 减按25%计入，按20%税率 = 实际5%
    const normalTax = taxableIncome * 0.25; // 一般企业25%
    benefits.push({
      policyName: '小型微利企业所得税优惠',
      eligible: true,
      estimatedSaving: Math.max(0, normalTax - actualTax),
      description:
        '应纳税所得额≤300万元的部分，减按25%计入应纳税所得额，按20%税率征收（实际税负5%）。',
    });
  } else {
    benefits.push({
      policyName: '小型微利企业所得税优惠',
      eligible: false,
      estimatedSaving: 0,
      description: '企业不完全符合小型微利企业条件，无法享受所得税优惠。',
    });
  }

  return {
    overallScore,
    overallLevel,
    overallLevelText,
    indicators,
    benefits,
  };
}

export function getLevelColor(level: string): string {
  switch (level) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    case 'normal':
      return '#10b981';
    default:
      return '#10b981';
  }
}

export function getLevelBgClass(level: string): string {
  switch (level) {
    case 'high':
      return 'bg-destructive/10 text-destructive';
    case 'medium':
      return 'bg-warning/15 text-warning';
    case 'low':
    case 'normal':
      return 'bg-success/15 text-success';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getLevelLabel(level: string): string {
  switch (level) {
    case 'high':
      return '高风险';
    case 'medium':
      return '中风险';
    case 'low':
      return '低风险';
    case 'normal':
      return '正常';
    default:
      return '-';
  }
}
