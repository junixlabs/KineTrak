import { create } from 'zustand'

interface Toast {
  id: number
  msg: string
  /** One reversing action offered beside the message (Undo), while the toast stands. */
  action?: { label: string; run: () => void }
}
interface ToastState {
  toasts: Toast[]
  show: (msg: string, action?: Toast['action']) => void
  dismiss: (id: number) => void
}

let seq = 0

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (msg, action) => {
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, msg, action }] }))
    // an offer to undo stays long enough to be read and reached
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), action ? 6000 : 2600)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
