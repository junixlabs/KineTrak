import { create } from 'zustand'

interface Toast {
  id: number
  msg: string
}
interface ToastState {
  toasts: Toast[]
  show: (msg: string) => void
  dismiss: (id: number) => void
}

let seq = 0

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (msg) => {
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, msg }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
