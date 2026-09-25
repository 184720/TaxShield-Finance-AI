import { Target, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_TEST_DATA, type ITaxFormData } from '@/data/testdata';
import { cn } from '@/lib/utils';

interface QuickFillSectionProps {
  onFill: (data: ITaxFormData) => void;
}

const FILL_CONFIG = [
  {
    level: 'low' as const,
    icon: Target,
    label: '🎯 低风险测试数据',
    desc: '合规经营，指标正常',
    bg: 'bg-[#f0fdf4]',
    border: 'border-[#bbf7d0]',
    text: 'text-[#16a34a]',
    hover: 'hover:bg-[#dcfce7]',
  },
  {
    level: 'medium' as const,
    icon: AlertTriangle,
    label: '⚠️ 中风险测试数据',
    desc: '部分指标异常，需关注',
    bg: 'bg-[#fffbeb]',
    border: 'border-[#fde68a]',
    text: 'text-[#d97706]',
    hover: 'hover:bg-[#fef3c7]',
  },
  {
    level: 'high' as const,
    icon: AlertOctagon,
    label: '🚨 高风险测试数据',
    desc: '多项指标预警，建议整改',
    bg: 'bg-[#fef2f2]',
    border: 'border-[#fecaca]',
    text: 'text-[#dc2626]',
    hover: 'hover:bg-[#fee2e2]',
  },
];

export default function QuickFillSection({ onFill }: QuickFillSectionProps) {
  const handleFill = (level: 'low' | 'medium' | 'high') => {
    const dataset = MOCK_TEST_DATA.find((d) => d.level === level);
    if (dataset) {
      onFill(dataset.data);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[#1e293b]">快捷填充</span>
        <span className="text-xs text-[#64748b]">
          点击一键填入模拟数据，快速体验检测功能
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FILL_CONFIG.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.level}
              type="button"
              variant="outline"
              onClick={() => handleFill(item.level)}
              className={cn(
                'h-auto py-4 px-4 justify-start flex-col items-start gap-1.5',
                'border rounded-xl transition-all duration-200',
                'hover:-translate-y-0.5',
                item.bg,
                item.border,
                item.text,
                item.hover,
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="size-4 shrink-0" />
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              <span className="text-xs opacity-75 font-normal">
                {item.desc}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
