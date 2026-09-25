import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-4 w-full border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-7 md:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          {/* 品牌与定位 */}
          <div className="flex items-start gap-3">
            <span className="ts-gradient-brand flex size-9 shrink-0 items-center justify-center rounded-xl text-white">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                税智盾 <span className="ts-tabular text-brand">TaxShield AI</span>
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                面向小微企业的AI财税健康管理与融资准备助手 · 先体检、再整改、再准备融资
              </p>
            </div>
          </div>

          {/* 合规声明 */}
          <div className="max-w-md space-y-1.5 text-left md:text-right">
            <p className="text-xs leading-5 text-slate-500">
              本工具基于现行通用政策设计，输出结果仅供企业税务风险自查参考，
              不构成税务鉴证、申报结论或法律意见，具体以主管税务机关认定为准。
            </p>
            <p className="text-[11px] leading-5 text-slate-400">
              AI 生成内容均需税务专业人员复核 · 政策依据全部来自本地知识库并标注文号与时效
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="ts-tabular text-[11px] text-slate-400">
            © {new Date().getFullYear()} 税智盾 TaxShield AI · 普惠金融方向展示 Demo
          </p>
          <p className="text-[11px] text-slate-400">助力中小企业合规经营</p>
        </div>
      </div>
    </footer>
  );
}
