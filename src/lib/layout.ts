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
const ROW = 52
const TOP = 56

// Right side grows to the right of the root; left side mirrors it.
const RIGHT_MODULE_X = ROOT_X + ROOT_W + GAP1
const RIGHT_FEATURE_X = RIGHT_MODULE_X + MODULE_W + GAP2
const LEFT_MODULE_X = ROOT_X - GAP1 - MODULE_W
const LEFT_FEATURE_X = LEFT_MODULE_X - GAP2 - FEATURE_W

/**
 * Balanced two-sided mindmap: modules split left/right of the root (by feature
 * count so both columns are ~equal height), features fan out on their module's
 * side. Halves the vertical extent vs a single column and reads like a real
 * mindmap. Works for any module/feature counts.
 */
export function computeMindmapLayout(modules: Module[], features: Feature[]): MindmapLayout {
  const featuresOf = (id: string) => features.filter((f) => f.moduleId === id)
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

  // Stack one side top-down; each module centers on its own features.
  const placeSide = (mods: Module[], which: Side) => {
    let row = 0
    mods.forEach((m) => {
      side[m.id] = which
      const own = featuresOf(m.id)
      const centers: number[] = []
      own.forEach((f) => {
        const c = TOP + row * ROW
        featureCenter[f.id] = c
        centers.push(c)
        row += 1
      })
      if (centers.length === 0) {
        centers.push(TOP + row * ROW)
        row += 1
      }
      moduleCenter[m.id] = centers.reduce((a, b) => a + b, 0) / centers.length
    })
    return row
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
    height: TOP + Math.max(rightRows, leftRows, 1) * ROW,
  }
  modules.forEach((m) => {
    const x = side[m.id] === 'left' ? LEFT_MODULE_X : RIGHT_MODULE_X
    layout.modules[m.id] = { x, y: moduleCenter[m.id] - MODULE_HALF }
  })
  features.forEach((f) => {
    const x = side[f.moduleId] === 'left' ? LEFT_FEATURE_X : RIGHT_FEATURE_X
    layout.features[f.id] = { x, y: featureCenter[f.id] - FEATURE_HALF }
  })
  return layout
}
