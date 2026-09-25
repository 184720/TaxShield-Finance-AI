import type { ReactNode } from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/modules/domain/types';

/* ============================================================================
 * 税智盾 TaxShield AI · 设计原语层
 * ----------------------------------------------------------------------------
 * 全局视觉统一口径（圆角 / 阴影 / 间距 / 字体层级 / 状态色）集中在此文件，
 * 页面组件只负责编排，不散用 Tailwind 原色，避免多页面视觉漂移。
 *
 * 状态色规范：绿色 = 正常 / 橙色 = 待整改 / 红色 = 风险
 * 所有新增 props 均为可选，保持对既有 8 个页面的向后兼容。
 * ========================================================================== */

/** 统一的卡片阴影：双层叠加，比单层 shadow-sm 更具层次与企业级质感 */
const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-14px_rgba(15,23,42,0.14)]';
/** 统一的卡片圆角与描边 */
const CARD_BASE = `rounded-2xl border border-slate-200/80 bg-white ${CARD_SHADOW}`;

export type StatusTone = 'default' | 'good' | 'warn' | 'bad' | 'brand';

/** 状态色 → 文字色映射（唯一口径） */
const TONE_TEXT: Record<StatusTone, string> = {
  default: 'text-slate-900',
  good: 'text-status-ok',
  warn: 'text-status-warn',
  bad: 'text-status-risk',
  brand: 'text-brand',
};

/** 状态色 → 柔和底色 + 描边 + 前景（用于徽章、色点） */
const TONE_CHIP: Record<StatusTone, string> = {
  default: 'bg-slate-100 text-slate-600 border-slate-200',
  good: 'bg-status-ok-soft text-status-ok border-status-ok-line',
  warn: 'bg-status-warn-soft text-status-warn border-status-warn-line',
  bad: 'bg-status-risk-soft text-status-risk border-status-risk-line',
  brand: 'bg-brand-soft text-brand border-brand-100',
};

const TONE_DOT: Record<StatusTone, string> = {
  default: 'bg-slate-400',
  good: 'bg-status-ok',
  warn: 'bg-status-warn',
  bad: 'bg-status-risk',
  brand: 'bg-brand-2',
};

const RISK_TONE: Record<RiskLevel, StatusTone> = {
  low: 'good',
  medium: 'warn',
  high: 'bad',
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const RISK_DESC: Record<RiskLevel, string> = {
  low: '处于可控区间，建议保持现有合规节奏',
  medium: '存在偏离信号，建议限期整改并复核',
  high: '偏离阈值明显，建议优先处置并留存证据',
};

/**
 * 健康分 → 状态色阶（全局唯一阈值口径，与既有业务判定保持一致）
 * >=80 正常 / >=60 需关注 / <60 风险
 */
export function scoreTone(score: number): StatusTone {
  if (score >= 80) return 'good';
  if (score >= 60) return 'warn';
  return 'bad';
}

/** 健康分 → 中文等级描述 */
export function scoreBandLabel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 60) return '需关注';
  if (score >= 40) return '较差';
  return '高危';
}

export const formatMoney = (value: number) => `¥${Math.round(value).toLocaleString('zh-CN')}`;

/* ---------------------------------------------------------------- 徽章类 */

export function RiskBadge({ level, size = 'md', withDescription = false }: { level: RiskLevel; size?: 'sm' | 'md'; withDescription?: boolean }) {
  const tone = RISK_TONE[level];
  const Icon = level === 'high' ? AlertTriangle : level === 'medium' ? AlertTriangle : CheckCircle2;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
          TONE_CHIP[tone],
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        )}
      >
        <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} />
        {RISK_LABEL[level]}
      </span>
      {withDescription && <span className="text-xs leading-4 text-slate-500">{RISK_DESC[level]}</span>}
    </span>
  );
}

/** 通用状态圆点 + 文案，用于图例、列表状态 */
export function StatusDot({ tone, children, className }: { tone: StatusTone; children?: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-slate-600', className)}>
      <span className={cn('size-1.5 shrink-0 rounded-full', TONE_DOT[tone])} />
      {children}
    </span>
  );
}

/** AI 内容归因标识：满足"AI 生成需明示"的合规与可信度要求 */
export function AIAttribution({
  variant = 'inline',
  text = '✨ AI生成 · 基于企业风险数据分析 · 需专业人员复核',
  confidence,
  className,
}: {
  variant?: 'inline' | 'block';
  text?: string;
  confidence?: number;
  className?: string;
}) {
  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-ai/20 bg-ai-soft px-2.5 py-1 text-[11px] font-medium text-ai',
          className,
        )}
      >
        <span className="ts-gradient-ai inline-block size-1.5 rounded-full" />
        {text}
        {typeof confidence === 'number' && (
          <span className="ts-tabular text-ai/70">· 置信度 {Math.round(confidence * 100)}%</span>
        )}
      </span>
    );
  }
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-ai/15 bg-ai-soft/70 px-3.5 py-2.5',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ai">
        <BrainCircuit className="size-3.5" />
        AI 辅助分析
      </span>
      <span className="text-xs leading-5 text-slate-600">{text}</span>
      {typeof confidence === 'number' && (
        <span className="ts-tabular ml-auto text-xs font-medium text-ai/80">置信度 {Math.round(confidence * 100)}%</span>
      )}
      <span className="w-full text-[11px] leading-4 text-slate-500 sm:w-auto">
        风险结论由规则引擎判定，AI 不参与风险定级；本内容需税务专业人员复核。
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- 标题类 */

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-brand-2 uppercase">
          <span className="h-3.5 w-0.5 rounded-full bg-brand-2" />
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2.5 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        {meta && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">{meta}</div>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{action}</div>}
    </div>
  );
}

/** 卡片内的键值元信息项 */
export function MetaItem({ label, value, icon: Icon, className }: { label: string; value: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2', className)}>
      {Icon && <Icon className="mt-0.5 size-3.5 shrink-0 text-slate-400" />}
      <div className="min-w-0">
        <p className="text-[11px] leading-4 text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm leading-5 font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 卡片类 */

export function StatCard({
  label,
  value,
  detail,
  tone = 'default',
  icon: Icon,
  loading = false,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: StatusTone;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn(CARD_BASE, 'p-5', className)}>
        <div className="ts-skeleton h-3.5 w-20 rounded-md" />
        <div className="ts-skeleton mt-4 h-7 w-24 rounded-md" />
        <div className="ts-skeleton mt-2.5 h-3 w-28 rounded-md" />
      </div>
    );
  }
  return (
    <div className={cn(CARD_BASE, 'group p-5 transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_38px_-16px_rgba(15,23,42,0.20)]', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-5 text-slate-500">{label}</p>
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-2 transition-colors group-hover:bg-brand-100">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className={cn('ts-tabular mt-3 text-2xl leading-8 font-bold', TONE_TEXT[tone])}>{value}</p>
      {detail && <p className="mt-1.5 text-xs leading-5 text-slate-400">{detail}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn(CARD_BASE, 'p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon && (
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-2">
              <Icon className="size-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-base leading-6 font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
          </div>
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <div className={cn('mt-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------ 健康指数环 */

/**
 * 大尺寸健康指数仪表盘
 * 纯 SVG 绘制，无第三方图表依赖，导出 PDF 时可稳定渲染。
 */
export function HealthScoreDial({
  score,
  max = 100,
  size = 220,
  tone,
  caption,
  className,
  variant = 'light',
}: {
  score: number;
  max?: number;
  size?: number;
  tone?: StatusTone;
  caption?: ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const resolvedTone = tone ?? scoreTone(score);
  const stroke = Math.max(10, Math.round(size / 16));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / max));
  const dashOffset = circumference * (1 - pct);

  const ringColor: Record<StatusTone, string> = {
    default: '#2563eb',
    good: '#15803d',
    warn: '#b45309',
    bad: '#b91c1c',
    brand: '#3d6bb5',
  };
  const color = ringColor[resolvedTone];
  const isDark = variant === 'dark';
  const trackColor = isDark ? 'rgba(255,255,255,0.16)' : '#e8edf5';
  const valueColor = isDark ? '#ffffff' : color;
  const subColor = isDark ? 'rgba(255,255,255,0.72)' : '#64748b';

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`税务健康指数 ${score} 分，满分 ${max} 分`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="ts-tabular ts-score-glow font-bold leading-none" style={{ fontSize: size * 0.3, color: valueColor }}>
            {score}
          </span>
          <span className="ts-tabular mt-1.5 text-xs font-medium" style={{ color: subColor }}>
            / {max} 分
          </span>
          <span
            className="mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : `${color}14`, color: isDark ? '#ffffff' : color }}
          >
            {scoreBandLabel(score)}
          </span>
        </div>
      </div>
      {caption && <div className="mt-4 text-center text-xs leading-5" style={{ color: subColor }}>{caption}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ 空 / 加载态 */

export function EmptyState({
  icon: Icon = ShieldAlert,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center', className)}>
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200/70">
        <Icon className="size-6 text-slate-400" />
      </span>
      <p className="mt-4 text-base font-semibold text-slate-800">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}

export function EmptyReport({ action }: { action?: ReactNode } = {}) {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="尚未生成体检报告"
      description="请先使用比赛演示数据或完成上传配置后开始检测，系统将基于规则引擎输出结构化风险结论。"
      action={action}
    />
  );
}

/** 区块级加载骨架，用于页面首屏与异步区块 */
export function SkeletonBlock({ className, rows = 3 }: { className?: string; rows?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="ts-skeleton h-3.5 rounded-md" style={{ width: `${92 - index * 11}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn(CARD_BASE, 'p-6', className)}>
      <div className="flex items-center gap-2.5">
        <div className="ts-skeleton size-7 rounded-lg" />
        <div className="ts-skeleton h-4 w-32 rounded-md" />
      </div>
      <SkeletonBlock className="mt-5" rows={4} />
    </div>
  );
}

/** AI 生成过程中的占位态：保持布局稳定，避免内容跳动 */
export function AIPendingState({ text = 'AI 正在读取风险证据与政策库…' }: { text?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-brand-2">
        <BrainCircuit className="size-4 animate-pulse" />
        {text}
      </div>
      <SkeletonBlock rows={3} />
    </div>
  );
}

/** 合规声明条：全局统一的免责与人工复核提示 */
export function ComplianceNote({ children, icon: Icon = ShieldCheck, className }: { children: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3', className)}>
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <p className="text-xs leading-5 text-slate-500">{children}</p>
    </div>
  );
}
