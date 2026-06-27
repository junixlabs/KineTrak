import type { ReactNode } from 'react'

/** Floating top-center hint pill shared by all three views. */
export default function ViewHint({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[18px] z-[15] flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-line bg-white px-3.5 py-[7px] shadow-[0_2px_10px_rgba(20,24,31,.07)]">
      <span className="text-[12px] font-semibold text-muted">{children}</span>
    </div>
  )
}
