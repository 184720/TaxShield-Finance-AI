import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCcw, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SuggestionListSection from './sections/SuggestionListSection';
import type { IRiskResult } from '@/lib/risk-calc';
import { loadRiskResult } from '@/lib/tax-store';

export default function SuggestionPage() {
  const [result, setResult] = useState<IRiskResult | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = loadRiskResult();
    if (!saved) {
      toast.error('请先完成风险检测');
      setTimeout(() => navigate('/'), 800);
      return;
    }
    setResult(saved);
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 text-[#4F7CFF] animate-spin" />
          <p className="text-sm text-[#64748b]">正在加载整改建议...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const abnormalCount = result.indicators.filter(
    (i) => i.level !== 'normal',
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
        {/* 顶部 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/result')}
            className={cn(
              'gap-1.5 h-9 rounded-xl border-[#e2e8f0]',
              'text-[#475569] hover:bg-[#f1f5f9]',
            )}
          >
            <ArrowLeft className="size-4" />
            返回检测结果
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className={cn(
              'gap-1.5 h-9 rounded-xl border-[#e2e8f0]',
              'text-[#475569] hover:bg-[#f1f5f9]',
            )}
          >
            <RefreshCcw className="size-4" />
            重新检测
          </Button>
        </motion.div>

        {/* 标题区 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-3"
        >
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full',
              'bg-[#4F7CFF]/[0.08] text-[#4F7CFF] text-xs font-medium',
            )}
          >
            <Lightbulb className="size-3.5" />
            第 3 步 · 整改建议
          </div>
          <h1 className="text-[26px] md:text-[30px] font-bold text-[#1e293b] leading-tight">
            针对性合规整改建议
          </h1>
          <p className="text-sm text-[#64748b] leading-relaxed max-w-2xl">
            以下为您的异常指标整改建议，按风险等级从高到低排列。
            建议逐项核对、逐条落实，如有疑问请咨询专业税务顾问。
          </p>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="size-2 rounded-full bg-[#dc2626]" />
              <span className="text-[#64748b]">
                {result.indicators.filter((i) => i.level === 'high').length} 项高风险
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="size-2 rounded-full bg-[#f59e0b]" />
              <span className="text-[#64748b]">
                {result.indicators.filter((i) => i.level === 'medium').length} 项中风险
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="size-2 rounded-full bg-[#16a34a]" />
              <span className="text-[#64748b]">
                {result.indicators.filter((i) => i.level === 'normal').length} 项正常
              </span>
            </div>
          </div>
        </motion.div>

        {/* 建议列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <SuggestionListSection indicators={result.indicators} />
        </motion.div>

        {/* 底部操作 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-4"
        >
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className={cn(
              'gap-2 h-11 px-6 rounded-xl',
              'bg-[#4F7CFF] hover:bg-[#4571F5]',
              'text-white font-medium',
              'shadow-[0_4px_12px_rgba(79_124_255_0.3)]',
            )}
          >
            <RefreshCcw className="size-4" />
            修改数据重新检测
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/result')}
            className={cn(
              'gap-2 h-11 px-6 rounded-xl border-[#e2e8f0]',
              'text-[#1e293b] hover:bg-[#f1f5f9]',
            )}
          >
            <ArrowLeft className="size-4" />
            返回结果页
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
