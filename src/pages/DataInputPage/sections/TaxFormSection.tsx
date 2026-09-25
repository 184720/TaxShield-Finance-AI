import { type ReactNode } from 'react';
import {
  Building2,
  Receipt,
  Calculator,
  Users,
  Wallet,
  FileBarChart,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ITaxFormData } from '@/data/testdata';

interface TaxFormSectionProps {
  data: ITaxFormData;
  onChange: (field: keyof ITaxFormData, value: string | number) => void;
}

const INDUSTRIES = [
  { value: 'service', label: '现代服务业' },
  { value: 'trade', label: '商贸业' },
  { value: 'other', label: '其他' },
];

const QUARTERS = [
  { value: '2026Q1', label: '2026年第一季度' },
  { value: '2026Q2', label: '2026年第二季度' },
  { value: '2026Q3', label: '2026年第三季度' },
  { value: '2026Q4', label: '2026年第四季度' },
];

interface FormGroupProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function FormGroup({ icon: Icon, title, subtitle, children }: FormGroupProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'size-10 rounded-xl flex items-center justify-center',
            'bg-[#4F7CFF]/[0.08] text-[#4F7CFF]',
          )}
        >
          <Icon className="size-4.5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1e293b]">{title}</h3>
          <p className="text-xs text-[#64748b]">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function FieldWrapper({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#334155]">{label}</Label>
      {children}
      {hint && (
        <p className="text-xs text-[#64748b] flex items-center gap-1">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function TaxFormSection({
  data,
  onChange,
}: TaxFormSectionProps) {
  const inputClass =
    'h-11 rounded-[12px] border-[#e2e8f0] bg-white text-sm text-[#1e293b] ' +
    'placeholder:text-[#94a3b8] focus-visible:ring-[#4F7CFF]/20 ' +
    'focus-visible:ring-[3px] focus-visible:border-[#4F7CFF] transition-shadow';

  const selectClass =
    'h-11 rounded-[12px] border-[#e2e8f0] bg-white text-sm text-[#1e293b] ' +
    'focus:ring-[#4F7CFF]/20 focus:ring-[3px] focus:border-[#4F7CFF] transition-shadow';

  return (
    <div className="space-y-8">
      <FormGroup
        icon={Building2}
        title="基础信息"
        subtitle="企业基本信息，用于判断优惠政策适配条件"
      >
        <FieldWrapper label="行业分类">
          <Select
            value={data.industry}
            onValueChange={(v) =>
              onChange('industry', v as ITaxFormData['industry'])
            }
          >
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder="请选择行业" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#e2e8f0]">
              {INDUSTRIES.map((i) => (
                <SelectItem key={i.value} value={i.value} className="text-sm">
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper label="申报季度">
          <Select
            value={data.quarter}
            onValueChange={(v) => onChange('quarter', v)}
          >
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder="请选择季度" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#e2e8f0]">
              {QUARTERS.map((q) => (
                <SelectItem key={q.value} value={q.value} className="text-sm">
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper label="从业人数（人）">
          <Input
            type="number"
            min={0}
            value={data.employeeCount}
            onChange={(e) =>
              onChange('employeeCount', Number(e.target.value) || 0)
            }
            className={inputClass}
          />
        </FieldWrapper>

        <FieldWrapper label="资产总额（万元）">
          <Input
            type="number"
            min={0}
            value={data.totalAssets}
            onChange={(e) =>
              onChange('totalAssets', Number(e.target.value) || 0)
            }
            className={inputClass}
          />
        </FieldWrapper>
      </FormGroup>

      <FormGroup
        icon={Receipt}
        title="增值税数据"
        subtitle="本季度开票及进项相关数据"
      >
        <FieldWrapper label="开票收入（元）">
          <Input
            type="number"
            min={0}
            value={data.invoicedRevenue}
            onChange={(e) =>
              onChange('invoicedRevenue', Number(e.target.value) || 0)
            }
            className={inputClass}
          />
        </FieldWrapper>

        <FieldWrapper label="未开票收入（元）">
          <Input
            type="number"
            min={0}
            value={data.uninvoicedRevenue}
            onChange={(e) =>
              onChange('uninvoicedRevenue', Number(e.target.value) || 0)
            }
            className={inputClass}
          />
        </FieldWrapper>

        <div className="md:col-span-2">
          <FieldWrapper
            label="进项税额（元）"
            hint={
              <>
                <Users className="inline size-3 mr-1 -mt-0.5 text-[#94a3b8]" />
                小规模纳税人一般不可抵扣进项，如有请如实填写
              </>
            }
          >
            <Input
              type="number"
              min={0}
              value={data.inputTax}
              onChange={(e) =>
                onChange('inputTax', Number(e.target.value) || 0)
              }
              className={inputClass}
            />
          </FieldWrapper>
        </div>
      </FormGroup>

      <FormGroup
        icon={Calculator}
        title="企业所得税数据"
        subtitle="本季度收入、成本、费用及利润数据"
      >
        <FieldWrapper label="营业收入（元）">
          <Input
            type="number"
            min={0}
            value={data.operatingRevenue}
            onChange={(e) =>
              onChange('operatingRevenue', Number(e.target.value) || 0)
            }
            className={inputClass}
          />
        </FieldWrapper>

        <FieldWrapper label="营业成本（元）">
          <Input
            type="number"
            min={0}
            value={data.operatingCost}
            onChange={(e) =>
              onChange('operatingCost', Number(e.target.value) || 0)
            }
            className={inputClass}
          />
        </FieldWrapper>

        <FieldWrapper label="销售费用（元）">
          <Input
            type="number"
            min={0}
            value={data.sellingExpenses}
            onChange={(e) =>
              onChange('sellingExpenses', Number(e.target.value) || 0)
            }
            className={inputClass}
          />
        </FieldWrapper>

        <FieldWrapper label="管理费用（元）">
          <Input
            type="number"
            min={0}
            value={data.adminExpenses}
            onChange={(e) =>
              onChange('adminExpenses', Number(e.target.value) || 0)
            }
            className={inputClass}
          />
        </FieldWrapper>

        <div className="md:col-span-2">
          <FieldWrapper
            label={
              <span className="flex items-center gap-1.5">
                利润总额（元）
                <Wallet className="size-3.5 text-[#94a3b8]" />
              </span>
            }
            hint={
              <>
                <FileBarChart className="inline size-3 mr-1 -mt-0.5 text-[#94a3b8]" />
                亏损请填写负数，将用于判断企业所得税优惠适配条件
              </>
            }
          >
            <Input
              type="number"
              value={data.totalProfit}
              onChange={(e) =>
                onChange('totalProfit', Number(e.target.value) || 0)
              }
              className={inputClass}
            />
          </FieldWrapper>
        </div>
      </FormGroup>
    </div>
  );
}
