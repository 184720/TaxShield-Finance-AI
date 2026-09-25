// EXPORTS: ITaxFormData, MOCK_TEST_DATA
export interface ITaxFormData {
  /** 行业：现代服务业/商贸业/其他 */
  industry: 'service' | 'trade' | 'other';
  /** 申报季度，如 "2026Q2" */
  quarter: string;
  /** 从业人数 */
  employeeCount: number;
  /** 资产总额（万元） */
  totalAssets: number;
  /** 开票收入（元） */
  invoicedRevenue: number;
  /** 未开票收入（元） */
  uninvoicedRevenue: number;
  /** 进项税额（元） */
  inputTax: number;
  /** 营业收入（元） */
  operatingRevenue: number;
  /** 营业成本（元） */
  operatingCost: number;
  /** 销售费用（元） */
  sellingExpenses: number;
  /** 管理费用（元） */
  adminExpenses: number;
  /** 利润总额（元） */
  totalProfit: number;
}

export interface ITestDataSet {
  id: string;
  name: string;
  level: 'low' | 'medium' | 'high';
  data: ITaxFormData;
}

export const MOCK_TEST_DATA: ITestDataSet[] = [
  {
    id: '1',
    name: '低风险测试数据',
    level: 'low',
    data: {
      industry: 'service',
      quarter: '2026Q2',
      employeeCount: 25,
      totalAssets: 300,
      invoicedRevenue: 200000,
      uninvoicedRevenue: 30000,
      inputTax: 0,
      operatingRevenue: 230000,
      operatingCost: 138000,
      sellingExpenses: 23000,
      adminExpenses: 35000,
      totalProfit: 34000,
    },
  },
  {
    id: '2',
    name: '中风险测试数据',
    level: 'medium',
    data: {
      industry: 'trade',
      quarter: '2026Q2',
      employeeCount: 80,
      totalAssets: 1200,
      invoicedRevenue: 450000,
      uninvoicedRevenue: 80000,
      inputTax: 52000,
      operatingRevenue: 530000,
      operatingCost: 420000,
      sellingExpenses: 45000,
      adminExpenses: 70000,
      totalProfit: -5000,
    },
  },
  {
    id: '3',
    name: '高风险测试数据',
    level: 'high',
    data: {
      industry: 'other',
      quarter: '2026Q2',
      employeeCount: 150,
      totalAssets: 3000,
      invoicedRevenue: 295000,
      uninvoicedRevenue: 5000,
      inputTax: 3000,
      operatingRevenue: 300000,
      operatingCost: 60000,
      sellingExpenses: 70000,
      adminExpenses: 80000,
      totalProfit: 90000,
    },
  },
];