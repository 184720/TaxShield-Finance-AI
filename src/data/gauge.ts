// EXPORTS: IGauge, MOCK_GAUGES
export interface IGauge {
  id: string
  /** 综合评分 0-100 */
  score: number
  /** 综合风险等级 */
  level: 'low' | 'medium' | 'high'
  /** 仪表盘标题 */
  title: string
  /** 风险等级描述 */
  levelText: string
  /** 仪表盘主色（十六进制） */
  color: string
}

export const MOCK_GAUGES: IGauge[] = [
  {
    id: '1',
    score: 15,
    level: 'low',
    title: '综合风险评分',
    levelText: '低风险',
    color: '#10b981',
  },
  {
    id: '2',
    score: 55,
    level: 'medium',
    title: '综合风险评分',
    levelText: '中风险',
    color: '#f59e0b',
  },
  {
    id: '3',
    score: 85,
    level: 'high',
    title: '综合风险评分',
    levelText: '高风险',
    color: '#ef4444',
  },
]