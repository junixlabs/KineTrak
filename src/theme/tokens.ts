import type { FeatureStatus, NodeStatus } from '@/shared/types'

/** Brand palette — single source for colors used in inline SVG / canvas contexts. */
export const palette = {
  brand: '#2f6fed',
  brandLight: '#6e8bff',
  brandDark: '#2a63d6',
  teal: '#0d9488',
  grape: '#7c5cff',
  amber: '#f59e0b',
  ink: '#14181f',
  muted: '#5b6470',
  faint: '#646c78',
  line: '#e5e8ec',
  app: '#eef1f5',
} as const

/** Feature status meta — drives pills across Mindmap / Story Map / Detail panel. */
export const featureStatusMeta: Record<FeatureStatus, { label: string; color: string; bg: string }> = {
  must: { label: 'Must-have', color: '#e5484d', bg: '#fdecec' },
  progress: { label: 'In progress', color: '#f59e0b', bg: '#fef3e2' },
  done: { label: 'Done', color: '#16a34a', bg: '#e7f6ee' },
  nice: { label: 'Nice-to-have', color: '#6e8bff', bg: '#eef1ff' },
}

export const featureStatusOrder: FeatureStatus[] = ['must', 'progress', 'done', 'nice']

/** Swimlane node status -> dot color. */
export const nodeStatusColor: Record<NodeStatus, string> = {
  done: '#16a34a',
  progress: '#f59e0b',
  todo: '#9aa2ad',
  blocked: '#e5484d',
}

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${a})`
}
