import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, SectionCard } from '@/components/TaxShieldPrimitives';
import { loadReportById, saveReport } from '@/lib/taxshield-store';
import { createRectifiedDemoData } from '@/modules/domain/demo-data';
import type { TaxDataBundle } from '@/modules/domain/types';
import { recheckReport } from '@/modules/report/recheck';

const labels: Record<string, string> = {
  accountingRevenue: '会计收入', operatingCost: '营业成本', sellingExpenses: '销售费用',
  adminExpenses: '管理费用', rAndDExpenses: '研发费用', totalProfit: '利润总额',
  invoicedRevenue: '开票收入', outputTax: '销项税额', inputTax: '进项税额',
  supplierConcentration: '供应商集中度（0–1）', redInvoiceAmount: '红字发票金额',
  abnormalInvoiceAmount: '异常发票金额', declaredRevenue: '申报收入',
  vatPayable: '应纳增值税', corporateIncomeTaxPayable: '应纳企业所得税',
  receivedAmount: '收款金额', contractAmount: '合同金额', revenue: '收入', cost: '成本', expenses: '费用',
};

export default function RecheckPage() {
  const { reportId } = useParams();
  const previous = loadReportById(reportId ?? '');
  const navigate = useNavigate();
  const [data, setData] = useState<TaxDataBundle | null>(() => previous?.inputSnapshot ? structuredClone(previous.inputSnapshot) : null);
  const [error, setError] = useState('');

  if (!previous || !data) {
    return <main className="mx-auto w-full max-w-5xl px-4 py-10"><PageTitle eyebrow="Recheck" title="开始复检" description="该历史记录未保存原始数据，无法复检。" /><Link className="mt-4 inline-block text-sm text-brand-2" to="/history">返回历史记录</Link></main>;
  }

  const field = (key: string, value: number, update: (value: number) => void) => (
    <label key={key} className="grid gap-1 text-sm">
      <span className="text-slate-500">{labels[key] ?? key}</span>
      <input className="h-10 rounded-md border border-input bg-white px-3" type="number" step="any" value={Number.isFinite(value) ? value : ''} onChange={(e) => update(e.target.value === '' ? Number.NaN : Number(e.target.value))} />
    </label>
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-6 md:py-10">
      <PageTitle
        eyebrow="Recheck · 整改闭环"
        title={`开始复检 · ${previous.profile.name}`}
        description="在整改完成后，用修正后的数据重新运行原有规则引擎，生成复检报告并与整改前对比。金额单位为元，留空字段按数据不足处理。"
      />

      {/* 复检操作区 */}
      <section className="flex flex-col gap-3 rounded-2xl border border-brand-soft bg-brand-soft/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 size-5 shrink-0 text-brand-2" />
          <div>
            <p className="font-semibold text-brand">原报告：{previous.reportId}</p>
            <p className="mt-1 text-sm text-slate-600">整改前健康分 <strong className="text-slate-900">{previous.healthIndex}</strong> / 100 · 风险 {previous.risks.length} 项</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setData(structuredClone(previous.inputSnapshot))}><RotateCcw className="size-4" />恢复原始数据</Button>
          {previous.dataSource === 'demo' && previous.profile.id === 'wuhan-zhichuang' && <Button variant="outline" className="gap-1.5 border-brand-soft text-brand-2 hover:bg-white" onClick={() => setData(createRectifiedDemoData())}><Sparkles className="size-4" />使用整改后 Demo 数据</Button>}
        </div>
      </section>

      <form className="space-y-5" onSubmit={(e) => {
        e.preventDefault();
        try {
          const next = recheckReport(previous, data);
          saveReport(next);
          navigate('/history');
        } catch (err) {
          setError(err instanceof Error ? err.message : '复检失败');
        }
      }}>
        {(['financial', 'invoice', 'declaration'] as const).map((group) => (
          <SectionCard key={group} title={{ financial: '财务数据', invoice: '发票数据', declaration: '申报数据' }[group]}>
            <div className="grid gap-3 md:grid-cols-3">{Object.entries(data[group]).map(([key, value]) => field(key, value, (v) => setData({ ...data, [group]: { ...data[group], [key]: v } })))}</div>
          </SectionCard>
        ))}

        <SectionCard title="资金流与合同">
          <div className="grid gap-3 md:grid-cols-2">
            {(['receivedAmount', 'contractAmount'] as const).map((key) => field(key, data[key], (value) => setData({ ...data, [key]: value, availability: { ...data.availability, [key]: Number.isFinite(value) } })))}
          </div>
        </SectionCard>

        <SectionCard title="月度趋势" action={<Button type="button" variant="outline" onClick={() => setData({ ...data, availability: { ...data.availability, monthlyTrend: true }, monthlyTrend: [...data.monthlyTrend, { month: '', revenue: Number.NaN, cost: Number.NaN, expenses: Number.NaN }] })}>增加月份</Button>}>
          {data.monthlyTrend.map((month, index) => (
            <div key={index} className="mb-4 grid gap-3 border-b border-slate-100 pb-4 last:mb-0 last:border-0 last:pb-0 md:grid-cols-4">
              <label className="grid gap-1 text-sm"><span className="text-slate-500">月份</span><input className="h-10 rounded-md border border-input bg-white px-3" value={month.month} onChange={(e) => setData({ ...data, monthlyTrend: data.monthlyTrend.map((m, i) => (i === index ? { ...m, month: e.target.value } : m)) })} /></label>
              {(['revenue', 'cost', 'expenses'] as const).map((key) => field(key, month[key], (value) => setData({ ...data, availability: { ...data.availability, monthlyTrend: true }, monthlyTrend: data.monthlyTrend.map((m, i) => (i === index ? { ...m, [key]: value } : m)) })))}
            </div>
          ))}
        </SectionCard>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2 bg-brand hover:bg-brand/90">运行复检并生成新报告</Button>
          <Link className="text-sm text-slate-500" to="/history">取消</Link>
        </div>
      </form>
    </main>
  );
}
