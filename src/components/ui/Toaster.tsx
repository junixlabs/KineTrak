import { Check } from 'lucide-react'
import { useToast } from '@/store/useToast'

/** Bottom-center transient toast stack. */
export default function Toaster() {
  const toasts = useToast((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2 rounded-lg bg-ink px-3.5 py-2.5 text-[13px] font-semibold text-white shadow-pop animate-pop"
        >
          <Check size={15} className="text-[#5bd98a]" strokeWidth={2.5} />
          {t.msg}
        </div>
      ))}
    </div>
  )
}
