import type { Feature, Module } from '@/store/types'

export interface XY {
  x: number
  y: number
}

export type Side = 'left' | 'right'

export interface MindmapLayout {
  root: XY
  modules: Record<string, XY>
  features: Record<string, XY>
  /** Which side of the root each module (and its features) sits on. */
  side: Record<string, Side>
  /** featureId → effective parent feature id (only valid depth-1 links). */
  parent: Record<string, string>
  height: number
}

// Node widths/half-heights (React Flow positions by top-left; we center vertically).
const ROOT_W = 188
const MODULE_W = 216
const FEATURE_W = 256
const ROOT_HALF = 34
const MODULE_HALF = 28
const FEATURE_HALF = 23

const ROOT_X = 40
const GAP1 = 64 // root ↔ module gap
const GAP2 = 88 // module ↔ feature gap
const ROW = 52 // vertical pitch of a feature row
const TOP = 56
const MODULE_GAP = 20 // extra vertical gap between module blocks
const SUB_INDENT = 36 // horizontal inset of a sub-feature under its parent

// Right side grows to the right of the root; left side mirrors it.
const RIGHT_MODULE_X = ROOT_X + ROOT_W + GAP1
const RIGHT_FEATURE_X = RIGHT_MODULE_X + MODULE_W + GAP2
const LEFT_MODULE_X = ROOT_X - GAP1 - MODULE_W
const LEFT_FEATURE_X = LEFT_MODULE_X - GAP2 - FEATURE_W

/**
 * Balanced two-sided mindmap with per-module collapse/expand: modules split
 * left/right of the root (by feature count so both columns stay ~balanced), and
 * only *expanded* modules fan their features out. Collapsed modules occupy a
 * single slot, so the map's height scales with the number of *visible* rows —
 * not the total feature count. This keeps large projects (hundreds of features)
 * readable and fit-able instead of degenerating into an unreadable tall ribbon.
 *
 * `expanded` is the set of module ids whose features should be laid out. Side
 * assignment ignores it so modules never jump sides when you expand one.
 */
export function computeMindmapLayout(
  modules: Module[],
  features: Feature[],
  expanded: Set<string> = new Set(),
): MindmapLayout {
  const byModule = new Map<string, Feature[]>()
  features.forEach((f) => {
    const list = byModule.get(f.moduleId)
    if (list) list.push(f)
    else byModule.set(f.moduleId, [f])
  })
  // Effective depth-1 parent links: parent must exist in the same module and be a
  // root itself. Anything else (missing/cross-module/nested parent) renders flat —
  // validate_board flags it, the layout never crashes on it.
  const byId = new Map(features.map((f) => [f.id, f]))
  const parentOf = (f: Feature): string | undefined => {
    if (!f.parentId || f.parentId === f.id) return undefined
    const p = byId.get(f.parentId)
    return p && p.moduleId === f.moduleId && !p.parentId ? p.id : undefined
  }
  const parent: Record<string, string> = {}
  features.forEach((f) => {
    const pid = parentOf(f)
    if (pid) parent[f.id] = pid
  })
  // Order features within a module so each parent is immediately followed by its
  // children (original order preserved among roots and among siblings).
  const featuresOf = (id: string) => {
    const own = byModule.get(id) ?? []
    const kids = new Map<string, Feature[]>()
    own.forEach((f) => {
      const pid = parent[f.id]
      if (!pid) return
      const list = kids.get(pid)
      if (list) list.push(f)
      else kids.set(pid, [f])
    })
    const ordered: Feature[] = []
    own.forEach((f) => {
      if (parent[f.id]) return
      ordered.push(f, ...(kids.get(f.id) ?? []))
    })
    return ordered
  }
  const span = (m: Module) => Math.max(featuresOf(m.id).length, 1)

  // Decide each module's side: honor a pinned `side`, then auto-balance the rest
  // by sending each to whichever side currently has fewer feature-rows. Original
  // order is preserved within each side (stacking happens in module order below).
  const sideOf: Record<string, Side> = {}
  let rowsL = 0
  let rowsR = 0
  modules.forEach((m) => {
    if (m.side === 'left') { sideOf[m.id] = 'left'; rowsL += span(m) }
    else if (m.side === 'right') { sideOf[m.id] = 'right'; rowsR += span(m) }
  })
  modules.forEach((m) => {
    if (sideOf[m.id]) return
    if (rowsR <= rowsL) { sideOf[m.id] = 'right'; rowsR += span(m) }
    else { sideOf[m.id] = 'left'; rowsL += span(m) }
  })
  const rightMods = modules.filter((m) => sideOf[m.id] === 'right')
  const leftMods = modules.filter((m) => sideOf[m.id] === 'left')

  const featureCenter: Record<string, number> = {}
  const moduleCenter: Record<string, number> = {}
  const side: Record<string, Side> = {}

  // Stack one side top-down. An expanded module reserves a row per feature and
  // centers on them; a collapsed module (or one with no features) occupies a
  // single module-height slot. Returns the side's total pixel height.
  const placeSide = (mods: Module[], which: Side) => {
    let y = TOP
    mods.forEach((m, i) => {
      if (i > 0) y += MODULE_GAP
      side[m.id] = which
      const own = featuresOf(m.id)
      if (expanded.has(m.id) && own.length > 0) {
        const centers: number[] = []
        own.forEach((f) => {
          const c = y + FEATURE_HALF
          featureCenter[f.id] = c
          centers.push(c)
          y += ROW
        })
        moduleCenter[m.id] = centers.reduce((a, b) => a + b, 0) / centers.length
      } else {
        moduleCenter[m.id] = y + MODULE_HALF
        y += MODULE_HALF * 2
      }
    })
    return y
  }

  const rightRows = placeSide(rightMods, 'right')
  const leftRows = placeSide(leftMods, 'left')

  const allCenters = modules.map((m) => moduleCenter[m.id])
  const rootCenter = allCenters.length ? allCenters.reduce((a, b) => a + b, 0) / allCenters.length : TOP

  const layout: MindmapLayout = {
    root: { x: ROOT_X, y: rootCenter - ROOT_HALF },
    modules: {},
    features: {},
    side,
    parent,
    height: Math.max(rightRows, leftRows, TOP),
  }
  modules.forEach((m) => {
    const x = side[m.id] === 'left' ? LEFT_MODULE_X : RIGHT_MODULE_X
    layout.modules[m.id] = { x, y: moduleCenter[m.id] - MODULE_HALF }
  })
  features.forEach((f) => {
    const c = featureCenter[f.id]
    if (c === undefined) return // collapsed module — feature not laid out
    // Sub-features inset toward the outside so the parent→child step reads as a level.
    const indent = parent[f.id] ? SUB_INDENT : 0
    const x = side[f.moduleId] === 'left' ? LEFT_FEATURE_X - indent : RIGHT_FEATURE_X + indent
    layout.features[f.id] = { x, y: c - FEATURE_HALF }
  })
  return layout
}
