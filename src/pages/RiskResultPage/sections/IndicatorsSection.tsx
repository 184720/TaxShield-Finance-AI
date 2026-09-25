import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { IRiskIndicator } from '@/lib/risk-calc';
import { getLevelColor, getLevelLabel } from '@/lib/risk-calc';

interface IndicatorsSectionProps {
  indicators: IRiskIndicator[];
}

const LEVEL_ICONS = {
  normal: CheckCircle2,
  low: CheckCircle2,
  medium: AlertTriangle,
  high: XCircle,
};

export default function IndicatorsSection({
  indicators,
}: IndicatorsSectionProps) {
  const normalCount = indicators.filter(
    (i) => i.level === 'normal' || i.level === 'low',
  ).length;
  const abnormalCount = indicators.length - normalCount;

  return (
    <Card
      className={cn(
        'border-[#e2e8f0]/80 bg-white',
        'shadow-[0_4px_24px_rgba(30_41_59_0.04)]',
        'rounded-2xl overflow-hidden',
      )}
    >
      <CardHeader className="pb-4 px-6 md:px-7 pt-5 md:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-[#1e293b]">
              <span className="size-1.5 rounded-full bg-[#4F7CFF]" />
              风险指标检测结果
            </CardTitle>
            <p className="text-xs text-[#64748b] mt-1">
              共检测 {indicators.length} 项核心指标，{normalCount} 项正常，
              {abnormalCount} 项异常
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#e2e8f0]/60">
          {indicators.map((ind, index) => {
            const LevelIcon = LEVEL_ICONS[ind.level];
            const color = getLevelColor(ind.level);
            const isNormal = ind.level === 'normal' || ind.level === 'low';

            return (
              <div
                key={ind.id}
                className={cn(
                  'px-5 md:px-7 py-4 transition-colors hover:bg-[#f8fafc]',
                  index === 0 && 'pt-4',
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="size-9 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    <LevelIcon className="size-4.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-sm font-medium text-[#1e293b] truncate">
                        {ind.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-sm font-semibold tabular-nums font-sans"
                          style={{ color }}
                        >
                          {ind.value}
                          {ind.unit}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${color}15`,
                            color,
                          }}
                        >
                          {getLevelLabel(ind.level)}
                        </span>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            100,
                            isNormal ? 80 + ((ind.value || 0) % 20) : Math.max(30, (ind.value || 50) % 90 + 20),
                          )}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-[#64748b]">
                        {ind.description}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">
                      阈值：{ind.threshold}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
