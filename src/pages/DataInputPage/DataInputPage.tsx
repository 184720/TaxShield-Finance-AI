import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlayCircle, FileBarChart, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import QuickFillSection from './sections/QuickFillSection';
import TaxFormSection from './sections/TaxFormSection';
import type { ITaxFormData } from '@/data/testdata';
import { calculateRisk } from '@/lib/risk-calc';
import { saveFormData, saveRiskResult } from '@/lib/tax-store';

const DEFAULT_DATA: ITaxFormData = {
  industry: 'service',
  quarter: '2026Q2',
  employeeCount: 0,
  totalAssets: 0,
  invoicedRevenue: 0,
  uninvoicedRevenue: 0,
  inputTax: 0,
  operatingRevenue: 0,
  operatingCost: 0,
  sellingExpenses: 0,
  adminExpenses: 0,
  totalProfit: 0,
};

export default function DataInputPage() {
  const [formData, setFormData] = useState<ITaxFormData>(DEFAULT_DATA);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  const handleFill = useCallback((data: ITaxFormData) => {
    setFormData(data);
    toast.success('已填充测试数据');
  }, []);

  const handleChange = useCallback(
    (field: keyof ITaxFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (formData.operatingRevenue <= 0) {
      toast.error('请填写营业收入');
      return;
    }
    if (formData.employeeCount <= 0) {
      toast.error('请填写从业人数');
      return;
    }

    setIsChecking(true);
    setTimeout(() => {
      try {
        const result = calculateRisk(formData);
        saveFormData(formData);
        saveRiskResult(result);
        const abnormalCount = result.indicators.filter(
          (i) => i.level !== 'normal',
        ).length;
        toast.success(
          `检测完成，共发现 ${abnormalCount} 项异常指标`,
        );
        navigate('/result');
      } catch {
        toast.error('检测失败，请重试');
      } finally {
        setIsChecking(false);
      }
    }, 1200);
  }, [formData, navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-center space-y-4"
        >
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full',
              'bg-[#4F7CFF]/[0.08] text-[#4F7CFF] text-xs font-medium',
            )}
          >
            <FileBarChart className="size-3.5" />
            季度申报前自检 · 8 项核心指标
          </div>
          <h1 className="text-[28px] md:text-[32px] font-bold text-[#1e293b] leading-tight">
            金税四期小微企业季度申报
            <span className="text-[#4F7CFF]"> 风险智能自检</span>
          </h1>
          <p className="text-sm text-[#64748b] max-w-xl mx-auto leading-relaxed">
            填入您的企业季度财务数据，一键检测 8 项核心税务风险指标，
            自动匹配税费优惠政策，获取专业合规整改建议
          </p>

          {/* 特性标签 */}
          <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
            {[
              { icon: ShieldCheck, text: '8项指标检测' },
              { icon: FileBarChart, text: '智能风险评分' },
              { icon: PlayCircle, text: '整改建议方案' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.text}
                  className="flex items-center gap-1.5 text-xs text-[#475569]"
                >
                  <Icon className="size-3.5 text-[#4F7CFF]" />
                  {item.text}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 表单卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card
            className={cn(
              'border-[#e2e8f0]/80 bg-white',
              'shadow-[0_4px_24px_rgba(30_41_59_0.04)]',
              'rounded-2xl',
              'overflow-hidden',
            )}
          >
            <CardHeader className="pb-2 px-6 md:px-8 pt-6 md:pt-7">
              <CardTitle className="text-base flex items-center gap-2 text-[#1e293b]">
                <span className="size-1.5 rounded-full bg-[#4F7CFF]" />
                数据录入
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8">
              <QuickFillSection onFill={handleFill} />

              <div className="h-px bg-[#e2e8f0]/60" />

              <TaxFormSection data={formData} onChange={handleChange} />
            </CardContent>
          </Card>
        </motion.div>

        {/* 底部操作栏 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="sticky bottom-6 z-40"
        >
          <div className="max-w-4xl mx-auto">
            <div
              className={cn(
                'flex items-center justify-between gap-4 px-5 py-3.5',
                'rounded-2xl bg-white border border-[#e2e8f0]/80',
                'shadow-[0_12px_32px_rgba(30_41_59_0.08)]',
                'backdrop-blur-sm',
              )}
            >
              <div className="text-xs text-[#64748b]">
                检测耗时约 1-2 秒，结果仅供参考
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isChecking}
                className={cn(
                  'min-w-[160px] gap-2 h-11 px-5',
                  'bg-[#4F7CFF] hover:bg-[#4571F5]',
                  'text-white font-medium',
                  'rounded-[12px]',
                  'shadow-[0_4px_12px_rgba(79_124_255_0.3)]',
                  'hover:shadow-[0_6px_16px_rgba(79_124_255_0.4)]',
                  'transition-all duration-200',
                )}
              >
                {isChecking ? (
                  <>
                    <PlayCircle className="size-4 animate-pulse" />
                    检测中...
                  </>
                ) : (
                  <>
                    <PlayCircle className="size-4" />
                    开始检测
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
