import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertTriangle, XCircle, CheckCircle2, FileText, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IRiskIndicator } from '@/lib/risk-calc';
import { getLevelColor, getLevelLabel } from '@/lib/risk-calc';

interface SuggestionListSectionProps {
  indicators: IRiskIndicator[];
}

const LEVEL_ICONS = {
  normal: CheckCircle2,
  low: CheckCircle2,
  medium: AlertTriangle,
  high: XCircle,
};

export default function SuggestionListSection({
  indicators,
}: SuggestionListSectionProps) {
  const abnormal = indicators.filter((i) => i.level !== 'normal');
  const sorted = [...abnormal].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2, normal: 3 };
    return rank[a.level] - rank[b.level];
  });

  if (sorted.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-[#e2e8f0]/80 bg-white p-8 md:p-12 text-center',
          'shadow-[0_4px_24px_rgba(30_41_59_0.04)]',
        )}
      >
        <div
          className={cn(
            'size-16 mx-auto rounded-2xl flex items-center justify-center',
            'bg-[#dcfce7]',
          )}
        >
          <CheckCircle2 className="size-8 text-[#16a34a]" />
        </div>
        <h3 className="text-xl font-bold text-[#1e293b] mt-5">
          恭喜！未检测到明显风险
        </h3>
        <p className="text-sm text-[#64748b] mt-2 max-w-md mx-auto leading-relaxed">
          您的各项税务指标均在正常范围内，请继续保持合规经营。
          建议定期进行自检，及时了解政策变化。
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
          {['按时申报', '留存凭证', '定期自查'].map((tip) => (
            <div
              key={tip}
              className="rounded-xl bg-[#f1f5f9] px-3 py-3 text-xs text-[#475569] font-medium"
            >
              {tip}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#e2e8f0]/80 bg-white',
        'shadow-[0_4px_24px_rgba(30_41_59_0.04)]',
        'overflow-hidden',
      )}
    >
      <div className="px-6 md:px-7 pt-5 md:pt-6 pb-4">
        <h2 className="text-base font-semibold flex items-center gap-2 text-[#1e293b]">
          <span className="size-1.5 rounded-full bg-[#4F7CFF]" />
          整改建议清单
          <span className="text-xs font-normal text-[#64748b] ml-1">
            （按风险等级从高到低排序）
          </span>
        </h2>
        <p className="text-xs text-[#64748b] mt-1">
          共 {sorted.length} 项异常指标，建议逐项核对并及时整改
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue={sorted[0]?.id.toString()}
        className="border-t border-[#e2e8f0]/60"
      >
        {sorted.map((ind, i) => {
          const LevelIcon = LEVEL_ICONS[ind.level];
          const color = getLevelColor(ind.level);

          return (
            <AccordionItem
              key={ind.id}
              value={ind.id.toString()}
              className="border-b-0 first:border-t-0 last:border-b-0"
            >
              <AccordionTrigger
                className={cn(
                  'px-5 md:px-7 py-4 hover:no-underline',
                  i < sorted.length - 1 && 'border-b border-[#e2e8f0]/60',
                )}
              >
                <div className="flex items-center gap-3 flex-1 text-left pr-4">
                  <div
                    className="size-9 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    <LevelIcon className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#1e293b] truncate">
                        {ind.name}
                      </span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{
                          backgroundColor: `${color}15`,
                          color,
                        }}
                      >
                        {getLevelLabel(ind.level)}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748b]">
                      当前值：
                      <span className="font-medium" style={{ color }}>
                        {ind.value}
                        {ind.unit}
                      </span>
                      <span className="mx-1.5 text-[#cbd5e1]">·</span>
                      阈值：{ind.threshold}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 md:px-7 pb-5 pt-1">
                <div className="space-y-4">
                  {/* 风险说明 */}
                  <div
                    className={cn(
                      'rounded-xl p-4 space-y-2',
                      'border',
                      ind.level === 'high'
                        ? 'bg-[#fef2f2] border-[#fecaca]'
                        : 'bg-[#fffbeb] border-[#fde68a]',
                    )}
                  >
                    <div
                      className={cn(
                        'text-xs font-semibold flex items-center gap-1.5',
                        ind.level === 'high'
                          ? 'text-[#dc2626]'
                          : 'text-[#d97706]',
                      )}
                    >
                      <AlertTriangle className="size-3.5" />
                      风险说明
                    </div>
                    <p className="text-sm leading-relaxed text-[#1e293b]">
                      {ind.description}
                    </p>
                  </div>

                  {/* 整改建议 */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#1e293b] flex items-center gap-1.5">
                      <FileText className="size-3.5 text-[#4F7CFF]" />
                      合规整改建议
                    </div>
                    <div className="pl-5 text-sm text-[#475569] leading-relaxed space-y-1.5">
                      {ind.suggestion
                        .split('\n')
                        .filter((s) => s.trim())
                        .map((line, idx) => (
                          <p key={idx} className="flex gap-2">
                            <span className="text-[#4F7CFF] shrink-0 mt-0.5">
                              •
                            </span>
                            <span>{line.replace(/^\d+\.\s*/, '')}</span>
                          </p>
                        ))}
                    </div>
                  </div>

                  {/* 政策依据 */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#1e293b] flex items-center gap-1.5">
                      <Scale className="size-3.5 text-[#4F7CFF]" />
                      政策依据
                    </div>
                    <p className="text-xs text-[#64748b] leading-relaxed pl-5">
                      {ind.policyBasis}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
