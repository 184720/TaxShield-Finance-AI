import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOCIAL_LINKS = [
  {
    name: '在线咨询',
    icon: MessageCircle,
    color: '#4F7CFF',
  },
];

export default function ContactWidget() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState('');

  // 首屏默认展开
  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[99999] flex flex-col-reverse items-end gap-3"
      aria-live="polite"
    >
      {/* 面板 */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className={cn(
              'w-[380px] max-h-[540px] overflow-hidden bg-white rounded-[20px]',
              'shadow-[0_12px_48px_rgba(0_0_0_0.12)]',
              'flex flex-col',
              'max-[420px]:w-[calc(100vw-32px)] max-[420px]:max-h-[70vh]',
            )}
          >
            {/* 头部蓝底 */}
            <div className="relative bg-[#4F7CFF] text-white overflow-hidden">
              {/* 装饰圆 */}
              <div
                className="absolute -right-12 -top-16 w-[200px] h-[200px] rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              />
              <div
                className="absolute -right-20 top-8 w-[160px] h-[160px] rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              />

              <div className="relative p-6 pb-10">
                {/* 顶部行 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* 头像 */}
                    <div
                      className="size-9 rounded-full flex items-center justify-center font-semibold text-sm"
                      style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                    >
                      税
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        税务顾问小蓝
                      </span>
                      {/* 在线绿点 */}
                      <span className="relative flex size-2">
                        <span
                          className="absolute inline-flex h-full w-full rounded-full"
                          style={{
                            backgroundColor: '#4ade80',
                            boxShadow: '0 0 0 3px rgba(74,222,128,0.25)',
                            opacity: 0.75,
                          }}
                        />
                        <span
                          className="relative inline-flex size-2 rounded-full"
                          style={{ backgroundColor: '#4ade80' }}
                        />
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="size-7 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                    aria-label="关闭"
                  >
                    <X className="size-3.5 text-white" />
                  </button>
                </div>

                {/* 问候区 */}
                <h2 className="text-[22px] font-bold text-white leading-tight">
                  您好 👋
                </h2>
                <p
                  className="text-sm mt-1 leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  有任何税务申报相关的问题，随时可以找我～
                </p>
              </div>
            </div>

            {/* 主体区（上叠白卡） */}
            <div
              className="flex-1 bg-white -mt-4 rounded-t-[16px] relative z-10 overflow-y-auto"
              style={{ padding: '20px 20px 16px' }}
            >
              {/* 预约按钮 */}
              <button
                type="button"
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3',
                  'rounded-[12px] bg-[#f1f5f9]',
                  'hover:bg-[#e2e8f0] transition-colors',
                  'mb-4',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="size-4 text-[#475569]" />
                  <span className="text-sm font-medium text-[#334155]">
                    预约税务咨询
                  </span>
                </div>
                <span className="text-xs text-[#64748b]">工作日 9:00-18:00</span>
              </button>

              {/* 社交按钮行 */}
              <div className="flex gap-2.5 mb-4">
                {SOCIAL_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      title={item.name}
                      className={cn(
                        'size-11 rounded-full bg-white border border-[#e2e8f0]',
                        'flex items-center justify-center',
                        'hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:scale-105',
                        'transition-all duration-200',
                      )}
                    >
                      <Icon className="size-5" style={{ color: item.color }} />
                    </button>
                  );
                })}
              </div>

              {/* 快速问题 */}
              <div className="mb-4">
                <p className="text-xs text-[#64748b] mb-2">常见问题</p>
                <div className="flex flex-wrap gap-2">
                  {['小规模优惠政策', '开票收入差异', '毛利率异常', '费用占比过高'].map(
                    (q) => (
                      <button
                        key={q}
                        type="button"
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-[4px]',
                          'bg-[#f1f5f9] text-[#475569]',
                          'hover:bg-[#e2e8f0] transition-colors',
                        )}
                      >
                        {q}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* 输入区 */}
            <form onSubmit={handleSend} className="px-5 pb-5 pt-1">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5',
                  'border border-[#e2e8f0] rounded-[14px]',
                  'focus-within:border-[#4F7CFF]',
                  'focus-within:shadow-[0_0_0_3px_rgba(79_124_255_0.08)]',
                  'transition-all',
                )}
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="输入您的问题..."
                  className={cn(
                    'flex-1 bg-transparent outline-none text-sm text-[#1e293b]',
                    'placeholder:text-[#94a3b8]',
                  )}
                />
                <button
                  type="submit"
                  className={cn(
                    'size-8 rounded-full bg-[#4F7CFF] flex items-center justify-center shrink-0',
                    'hover:bg-[#4571F5] hover:scale-105 active:scale-95',
                    'transition-all duration-200',
                  )}
                  aria-label="发送"
                >
                  <Send className="size-3.5 text-white" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 气泡按钮 */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'size-14 rounded-full bg-[#4F7CFF] text-white',
          'flex items-center justify-center',
          'shadow-[0_4px_16px_rgba(79_124_255_0.35)]',
          'hover:bg-[#4571F5]',
          'transition-colors',
        )}
        aria-label={isOpen ? '关闭联系面板' : '打开联系面板'}
      >
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </motion.button>
    </div>
  );
}
