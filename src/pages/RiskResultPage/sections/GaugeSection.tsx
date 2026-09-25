import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { IRiskResult } from '@/lib/risk-calc';
import { getLevelColor } from '@/lib/risk-calc';

interface GaugeSectionProps {
  result: IRiskResult;
}

export default function GaugeSection({ result }: GaugeSectionProps) {
  const color = getLevelColor(result.overallLevel);

  const option = useMemo<EChartsOption>(() => {
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          splitNumber: 10,
          itemStyle: {
            color: color,
          },
          progress: {
            show: true,
            width: 14,
            roundCap: true,
          },
          pointer: {
            icon: 'path://M2090.36389,615.30999 L2100,615 L2030,570 L2030,660 Z',
            length: '62%',
            width: 8,
            offsetCenter: [0, '5%'],
            itemStyle: {
              color: color,
            },
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 14,
              color: [[1, '#e2e8f0']],
            },
          },
          axisTick: {
            distance: -24,
            splitNumber: 5,
            lineStyle: {
              width: 1,
              color: '#cbd5e1',
            },
          },
          splitLine: {
            distance: -28,
            length: 8,
            lineStyle: {
              width: 2,
              color: '#94a3b8',
            },
          },
          axisLabel: {
            distance: -44,
            color: '#94a3b8',
            fontSize: 11,
          },
          anchor: {
            show: true,
            size: 14,
            itemStyle: {
              color: color,
              borderColor: '#fff',
              borderWidth: 3,
            },
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            fontSize: 42,
            fontWeight: 700,
            color: color,
            offsetCenter: [0, '30%'],
            formatter: '{value}分',
            fontFamily: 'Inter',
          },
          data: [
            {
              value: result.overallScore,
            },
          ],
        },
      ],
    };
  }, [result.overallScore, color]);

  const LevelIcon =
    result.overallLevel === 'low'
      ? ShieldCheck
      : result.overallLevel === 'medium'
        ? ShieldAlert
        : ShieldX;

  const levelDesc =
    result.overallLevel === 'low'
      ? '各项指标基本正常，继续保持合规经营'
      : result.overallLevel === 'medium'
        ? '部分指标存在异常，建议关注并及时调整'
        : '多项指标触发预警，建议立即整改并咨询专业人士';

  const abnormalCount = result.indicators.filter(
    (i) => i.level !== 'normal',
  ).length;

  return (
    <Card
      className={cn(
        'border-[#e2e8f0]/80 bg-white',
        'shadow-[0_4px_24px_rgba(30_41_59_0.04)]',
        'rounded-2xl overflow-hidden',
      )}
    >
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-[300px] flex items-center justify-center">
            <ReactECharts
              option={option}
              theme="ud"
              style={{ width: '100%', height: '300px' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div
                className="size-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}15`, color }}
              >
                <LevelIcon className="size-6" />
              </div>
              <div>
                <div className="text-sm text-[#64748b]">综合风险评分</div>
                <div className="text-2xl font-bold" style={{ color }}>
                  {result.overallLevelText}
                </div>
              </div>
            </div>
            <p className="text-sm text-[#64748b] leading-relaxed">
              {levelDesc}
            </p>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl bg-[#f1f5f9] p-3.5 text-center">
                <div className="text-xl font-bold text-[#1e293b] font-sans tabular-nums">
                  {result.indicators.length}
                </div>
                <div className="text-xs text-[#64748b] mt-0.5">
                  检测指标
                </div>
              </div>
              <div className="rounded-xl bg-[#fef2f2] p-3.5 text-center">
                <div className="text-xl font-bold text-[#dc2626] font-sans tabular-nums">
                  {abnormalCount}
                </div>
                <div className="text-xs text-[#dc2626]/70 mt-0.5">
                  异常项
                </div>
              </div>
              <div className="rounded-xl bg-[#f0fdf4] p-3.5 text-center">
                <div className="text-xl font-bold text-[#16a34a] font-sans tabular-nums">
                  {result.indicators.length - abnormalCount}
                </div>
                <div className="text-xs text-[#16a34a]/70 mt-0.5">
                  正常项
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
