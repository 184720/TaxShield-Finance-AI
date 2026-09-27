import { NavLink } from 'react-router-dom';
import { Building2, FileText, FileUp, History, LayoutDashboard, ShieldCheck, ShieldAlert, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/dashboard', label: '驾驶舱', icon: LayoutDashboard },
  { path: '/profile', label: '企业画像', icon: Building2 },
  { path: '/upload', label: '数据上传', icon: FileUp },
  { path: '/risk-analysis', label: '风险分析', icon: ShieldAlert },
  { path: '/report', label: '健康报告', icon: FileText },
  { path: '/financing', label: '融资准备', icon: Building2 },
  { path: '/growth', label: '成长档案', icon: TrendingUp },
  { path: '/trust', label: '可信中心', icon: ShieldCheck },
  { path: '/knowledge', label: '知识资产', icon: FileText },
  { path: '/cases', label: '案例中心', icon: Building2 },
  { path: '/history', label: '历史检测', icon: History },
];

export default function Header() {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'bg-white/85 backdrop-blur-xl',
        'border-b border-slate-200/70',
        'shadow-[0_1px_2px_rgba(15,23,42,0.03)]',
      )}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex min-h-16 flex-col items-start justify-between gap-3 py-3 lg:flex-row lg:items-center">
          {/* ===== 品牌区 ===== */}
          <NavLink to="/dashboard" className="ts-focus-ring group flex shrink-0 items-center gap-3 rounded-xl">
            <div
              className={cn(
                'ts-gradient-brand size-10 rounded-xl flex items-center justify-center',
                'text-white shadow-[0_6px_16px_-6px_rgba(26,54,93,0.6)]',
                'transition-transform duration-200 group-hover:scale-[1.04]',
              )}
            >
              <ShieldCheck className="size-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight text-slate-900">
                税智盾 <span className="ts-tabular text-brand">TaxShield AI</span>
              </span>
              <span className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">
                AI财税健康管理与融资准备
              </span>
            </div>
          </NavLink>

          {/* ===== 步骤式导航 ===== */}
          <nav aria-label="主导航" className="flex w-full min-w-0 items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/70 p-1 lg:w-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  className={({ isActive }) => cn(
                    'ts-focus-ring flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-white text-brand shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_10px_-6px_rgba(15,23,42,0.18)] font-semibold'
                      : 'text-slate-500 hover:bg-white/60 hover:text-slate-800',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
