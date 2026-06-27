import { Clock } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'

export default function SnapshotBanner() {
  const data = useWorkspace((s) => s.data)
  const activeSnapshot = useWorkspace((s) => s.activeSnapshot)
  const setSnapshot = useWorkspace((s) => s.setSnapshot)
  if (activeSnapshot === 'current') return null

  const snap = data.snapshots.find((s) => s.id === activeSnapshot)

  return (
    <div className="flex flex-none items-center gap-2.5 border-b border-[#f5d98b] bg-[#fff7e6] px-[18px] py-2 text-[12.5px] font-semibold text-[#8a6d1f]">
      <Clock size={15} strokeWidth={2} className="text-[#b8860b]" />
      <span>
        Đang xem snapshot lịch sử — <strong>{snap?.name}</strong>. Đây là trạng thái đã đóng băng, chỉ
        đọc.
      </span>
      <button
        onClick={() => setSnapshot('current')}
        className="ml-1.5 h-6 rounded-md border border-[#e7c66a] bg-white px-2.5 text-[12px] font-bold text-[#8a6d1f]"
      >
        Quay lại bản hiện tại
      </button>
    </div>
  )
}
