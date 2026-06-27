import type { Feature, Module } from '@/store/types'

export interface XY {
  x: number
  y: number
}

export interface MindmapLayout {
  root: XY
  modules: Record<string, XY>
  features: Record<string, XY>
  height: number
}

// Column x-positions and node half-heights (top-left = center - half-height).
const ROOT_X = 40
const MODULE_X = 292
const FEATURE_X = 596
const ROOT_HALF = 34
const MODULE_HALF = 28
const FEATURE_HALF = 23
const ROW = 52
const TOP = 56

/**
 * Position the mindmap from the data itself: features are stacked in data order,
 * each module centers on its own features, the root centers on the modules.
 * Works for any module/feature counts — no hardcoded "4 modules × 3" assumption.
 */
export function computeMindmapLayout(modules: Module[], features: Feature[]): MindmapLayout {
  const featureCenter: Record<string, number> = {}
  const moduleCenters: number[] = []
  const moduleCenterById: Record<string, number> = {}

  let row = 0
  modules.forEach((m) => {
    const own = features.filter((f) => f.moduleId === m.id)
    const centers: number[] = []
    own.forEach((f) => {
      const c = TOP + row * ROW
      featureCenter[f.id] = c
      centers.push(c)
      row += 1
    })
    // Empty module still occupies one slot so it doesn't collapse onto a neighbor.
    if (centers.length === 0) {
      centers.push(TOP + row * ROW)
      row += 1
    }
    const mc = centers.reduce((a, b) => a + b, 0) / centers.length
    moduleCenterById[m.id] = mc
    moduleCenters.push(mc)
  })

  const rootCenter = moduleCenters.length
    ? moduleCenters.reduce((a, b) => a + b, 0) / moduleCenters.length
    : TOP

  const layout: MindmapLayout = {
    root: { x: ROOT_X, y: rootCenter - ROOT_HALF },
    modules: {},
    features: {},
    height: TOP + Math.max(row, 1) * ROW,
  }
  modules.forEach((m) => {
    layout.modules[m.id] = { x: MODULE_X, y: moduleCenterById[m.id] - MODULE_HALF }
  })
  features.forEach((f) => {
    layout.features[f.id] = { x: FEATURE_X, y: featureCenter[f.id] - FEATURE_HALF }
  })
  return layout
}
