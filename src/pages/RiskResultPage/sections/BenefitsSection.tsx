import { BadgeCheck, BadgeX, Wallet, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { ITaxBenefit } from '@/lib/risk-calc';

interface BenefitsSectionProps {
  benefits: ITaxBenefit[];
}

function formatMoney(amount: number): string {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + ' 万元';
  }
  return amount.toLocaleString('zh-CN') + ' 元';
}

export default function BenefitsSection({ benefits }: BenefitsSectionProps) {
  const navigate = useNavigate();
  const totalSaving = benefits.reduce((sum, b) => sum + b.estimatedSaving, 0);
  const eligibleCount = benefits.filter((b) => b.eligible).length;

  return (
    <Card
      className={cn(
        'border-[#e2e8f0]/80 bg-white',
        'shadow-[0_4px_24px_rgba(30_41_59_0.04)]',
        'rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-[#4F7CFF]/[0.02] via-white to-[#4F7CFF]/[0.03]',
      )}
    >
      <CardHeader className="pb-4 px-6 md:px-7 pt-5 md:pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-[#1e293b]">
              <span className="size-1.5 rounded-full bg-[#4F7CFF]" />
              税费优惠适配结果
            </CardTitle>
            <p className="text-xs text-[#64748b] mt-1">
              按填报信息提示待核实的税费优惠，适用资格需专业复核
            </p>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#64748b] mb-0.5">
              预计减免合计
            </div>
            <div
              className={cn(
                'text-xl font-bold font-sans tabular-nums',
                totalSaving > 0 ? 'text-[#16a34a]' : 'text-[#64748b]',
              )}
            >
              {formatMoney(totalSaving)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 md:px-7 pb-6 space-y-3">
        {benefits.map((benefit, i) => (
          <div
            key={i}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              benefit.eligible
                ? 'border-[#bbf7d0] bg-[#f0fdf4]'
                : 'border-[#e2e8f0] bg-white',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'size-9 shrink-0 rounded-xl flex items-center justify-center',
                  benefit.eligible
                    ? 'bg-[#16a34a]/15 text-[#16a34a]'
                    : 'bg-[#f1f5f9] text-[#94a3b8]',
                )}
              >
                {benefit.eligible ? (
                  <BadgeCheck className="size-4.5" />
                ) : (
                  <BadgeX className="size-4.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-[#1e293b]">
                    {benefit.policyName}
                  </h4>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                      benefit.eligible
                        ? 'bg-[#16a34a]/15 text-[#16a34a]'
                        : 'bg-[#f1f5f9] text-[#64748b]',
                    )}
                  >
                    {benefit.eligible ? '符合条件' : '暂不符合'}
                  </span>
                </div>
                <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
                  {benefit.description}
                </p>
                {benefit.eligible && benefit.estimatedSaving > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#16a34a] font-semibold">
                    <Wallet className="size-3.5" />
                    预计减免：{formatMoney(benefit.estimatedSaving)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="pt-3 flex items-center justify-between">
          <p className="text-xs text-[#64748b]">
            已匹配 {eligibleCount} / {benefits.length} 项优惠政策
          </p>
          <Button
            onClick={() => navigate('/suggestions')}
            size="sm"
            className={cn(
              'gap-1.5 h-9 px-4 rounded-xl',
              'bg-[#4F7CFF] hover:bg-[#4571F5]',
              'text-white font-medium',
              'shadow-[0_4px_10px_rgba(79_124_255_0.25)]',
            )}
          >
            查看整改建议
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
