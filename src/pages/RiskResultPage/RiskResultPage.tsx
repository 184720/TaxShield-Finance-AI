import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import GaugeSection from './sections/GaugeSection';
import IndicatorsSection from './sections/IndicatorsSection';
import BenefitsSection from './sections/BenefitsSection';
import type { IRiskResult } from '@/lib/risk-calc';
import { loadRiskResult } from '@/lib/tax-store';

export default function RiskResultPage() {
  const [result, setResult] = useState<IRiskResult | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = loadRiskResult();
    if (!saved) {
      toast.error('请先填写数据并开始检测');
      setTimeout(() => navigate('/'), 800);
      return;
    }
    const timer = setTimeout(() => {
      setResult(saved);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 text-[#4F7CFF] animate-spin" />
          <p className="text-sm text-[#64748b]">正在加载检测结果...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
        {/* 顶部导航栏 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className={cn(
              'gap-1.5 h-9 rounded-xl border-[#e2e8f0]',
              'text-[#475569] hover:bg-[#f1f5f9]',
            )}
          >
            <ArrowLeft className="size-4" />
            返回修改数据
          </Button>
          <Button
            onClick={() => navigate('/suggestions')}
            size="sm"
            className={cn(
              'gap-1.5 h-9 rounded-xl',
              'bg-[#4F7CFF] hover:bg-[#4571F5]',
              'text-white font-medium',
              'shadow-[0_4px_10px_rgba(79_124_255_0.25)]',
            )}
          >
            <Lightbulb className="size-4" />
            查看整改建议
          </Button>
        </motion.div>

        {/* 仪表盘 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <GaugeSection result={result} />
        </motion.div>

        {/* 风险指标 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <IndicatorsSection indicators={result.indicators} />
        </motion.div>

        {/* 税费优惠 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <BenefitsSection benefits={result.benefits} />
        </motion.div>

        {/* 底部 CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex justify-center pb-4"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/suggestions')}
            className={cn(
              'gap-2 h-11 px-6 rounded-xl border-[#e2e8f0]',
              'text-[#1e293b] hover:bg-[#f1f5f9]',
            )}
          >
            <Lightbulb className="size-4" />
            查看详细整改建议
            <ArrowLeft className="size-4 rotate-180" />
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
