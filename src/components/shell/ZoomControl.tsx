interface ZoomControlProps {
  zoomPercent: number
  onMinus: () => void
  onPlus: () => void
  onFit: () => void
}

/** Presentational zoom control pinned bottom-left of a view. */
export default function ZoomControl({ zoomPercent, onMinus, onPlus, onFit }: ZoomControlProps) {
  return (
    <div className="absolute bottom-[18px] left-[18px] z-20 flex items-center gap-1 rounded-[10px] border border-line bg-white p-[5px] shadow-[0_4px_14px_rgba(20,24,31,.08)]">
      <button
        onClick={onMinus}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] text-[18px] text-muted hover:bg-[#f4f6f9]"
        aria-label="Zoom out"
      >
        −
      </button>
      <span className="min-w-[42px] text-center font-mono text-[12px] font-bold text-ink">
        {zoomPercent}%
      </span>
      <button
        onClick={onPlus}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] text-[18px] text-muted hover:bg-[#f4f6f9]"
        aria-label="Zoom in"
      >
        +
      </button>
      <div className="mx-0.5 h-[18px] w-px bg-line" />
      <button
        onClick={onFit}
        className="h-[30px] rounded-[7px] px-2.5 text-[12px] font-semibold text-muted hover:bg-[#f4f6f9]"
      >
        Fit
      </button>
    </div>
  )
}
