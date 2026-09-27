import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, Send, Sparkles, X, AlertCircle, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TaxHealthReport } from '@/modules/domain/types';
import { chatWithAssistant } from '@/modules/ai';
import type { AIChatContext, AIChatMessage } from '@/modules/ai';
import { cn } from '@/lib/utils';

interface AIAssistantWidgetProps {
  report: TaxHealthReport;
  /** 受控打开状态（可选）。不传则组件内部自管理。 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const QUICK_QUESTIONS = [
  '当前最高风险是什么？',
  '为什么判断供应商集中风险？',
  '这个风险的数据依据是什么？',
  '企业应该如何整改？',
  '需要准备哪些材料？',
];

type UIMessage = AIChatMessage & { id: string; pending?: boolean; error?: boolean };

function buildContext(report: TaxHealthReport): AIChatContext {
  return {
    reportId: report.reportId,
    enterpriseName: report.profile.name,
    dataSource: report.dataSource,
    healthIndex: report.healthIndex,
    overallLevel: report.overallLevel,
    risks: report.risks.map((risk) => ({
      id: risk.id,
      riskName: risk.riskName,
      category: risk.category,
      level: risk.level,
      reason: risk.reason,
      evidence: risk.evidence,
      suggestion: risk.suggestion,
      policyReferences: risk.policyReferences,
    })),
  };
}

let messageIdSeq = 0;
const nextId = () => `m-${Date.now()}-${++messageIdSeq}`;

export default function AIAssistantWidget({ report, open: controlledOpen, onOpenChange }: AIAssistantWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const context = useMemo(() => buildContext(report), [report]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setError(null);
    const userMsg: UIMessage = { id: nextId(), role: 'user', content: trimmed };
    const history: AIChatMessage[] = messages
      .filter((m) => !m.pending && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    const pendingId = nextId();
    setMessages((prev) => [...prev, { id: pendingId, role: 'assistant', content: '', pending: true }]);
    try {
      const resp = await chatWithAssistant({
        reportId: report.reportId,
        context,
        question: trimmed,
        history,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, content: resp.answer, pending: false }
            : m,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI 助手暂时不可用';
      setError(`Qwen 在线问答失败：${msg}。请稍后重试，或检查服务端模型服务配置。`);
      setMessages((prev) => prev.filter((m) => m.id !== pendingId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className={cn(
              'flex w-[420px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl bg-white',
              'shadow-[0_12px_48px_rgba(15,23,42,0.18)]',
              'border border-slate-200/80',
              'h-[560px] max-h-[calc(100vh-120px)]',
            )}
          >
            {/* 头部 */}
            <div className="relative shrink-0 overflow-hidden bg-brand text-white">
              <div className="absolute -right-10 -top-12 size-40 rounded-full bg-white/10" />
              <div className="absolute -right-16 top-6 size-28 rounded-full bg-white/5" />
              <div className="relative flex items-center justify-between p-4">
                <div className="flex items-center gap-2.5">
                  <span className="ts-gradient-ai flex size-8 items-center justify-center rounded-lg text-white">
                    <BrainCircuit className="size-4" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">税智盾 AI 助手</p>
                    <p className="mt-0.5 text-[11px] text-white/75">
                      基于 {report.profile.name} 当前风险报告 · 辅助理解已有风险，不参与风险判断
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-7 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
                  aria-label="关闭 AI 助手"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* 消息区 */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
              {messages.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-center">
                  <Sparkles className="mx-auto size-5 text-brand-2" />
                  <p className="mt-2 text-sm font-medium text-slate-800">向我提问关于当前风险报告的问题</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    问答仅基于已生成的风险结论、证据与政策依据，不重新判定风险等级。
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6',
                      m.role === 'user'
                        ? 'bg-brand text-white'
                        : m.error
                          ? 'border border-status-risk-line bg-status-risk-soft text-status-risk'
                          : 'border border-slate-200 bg-white text-slate-800',
                    )}
                  >
                    {m.pending ? (
                      <div className="flex items-center gap-2 text-slate-500">
                        <BrainCircuit className="size-4 animate-pulse text-brand-2" />
                        <span className="text-xs">Qwen 正在分析当前风险数据…</span>
                      </div>
                    ) : m.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:my-1 prose-li:my-0 prose-strong:text-brand-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-status-risk-line bg-status-risk-soft px-3 py-2.5 text-xs leading-5 text-status-risk">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* 快捷问题 */}
            {messages.length === 0 && (
              <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2.5">
                <p className="mb-2 text-[11px] font-medium text-slate-500">常见问题</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      disabled={loading}
                      className={cn(
                        'rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600',
                        'hover:border-brand-100 hover:bg-brand-soft hover:text-brand-2',
                        'transition-colors disabled:opacity-50',
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 输入区 */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="shrink-0 border-t border-slate-100 bg-white px-3 py-3"
            >
              <div
                className={cn(
                  'flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2',
                  'focus-within:border-brand-100 focus-within:shadow-[0_0_0_3px_rgba(26,54,93,0.08)]',
                  'transition-all',
                )}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入关于当前风险报告的问题…"
                  maxLength={500}
                  disabled={loading}
                  className={cn(
                    'flex-1 bg-transparent text-sm text-slate-900 outline-none',
                    'placeholder:text-slate-400 disabled:opacity-50',
                  )}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full bg-brand text-white shrink-0',
                    'hover:bg-brand-600 active:scale-95 transition-all',
                    'disabled:opacity-40 disabled:hover:bg-brand',
                  )}
                  aria-label="发送问题"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] leading-4 text-slate-400">
                <ShieldCheck className="size-3 shrink-0" />
                AI 回答基于已生成风险数据，不构成申报意见；建议由税务专业人员复核。
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          'flex size-14 items-center justify-center rounded-full text-white',
          'ts-gradient-ai shadow-[0_6px_18px_-4px_rgba(26,54,93,0.5)]',
          'hover:shadow-[0_8px_22px_-4px_rgba(26,54,93,0.6)]',
          'transition-shadow',
        )}
        aria-label={open ? '关闭税智盾 AI 助手' : '打开税智盾 AI 助手'}
        title="税智盾 AI 助手"
      >
        {open ? <X className="size-5" /> : <BrainCircuit className="size-5" />}
      </motion.button>
    </div>
  );
}
