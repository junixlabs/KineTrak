import type { VcsAdapter, VcsChange } from './types'
import { githubAdapter } from './github'
import { gitlabAdapter } from './gitlab'

// The provider registry. Add a provider by importing its adaptor and listing it.
const ADAPTERS: VcsAdapter[] = [githubAdapter, gitlabAdapter]

export function getAdapter(provider: string): VcsAdapter | undefined {
  return ADAPTERS.find((a) => a.provider === provider.toLowerCase())
}

export function listProviders(): string[] {
  return ADAPTERS.map((a) => a.provider)
}

/**
 * Which board nodes does a changed file touch? A codeRef matches a changed path
 * when they are equal, or one contains the other as a directory prefix (so a ref
 * to `src/lib/` catches `src/lib/impact.ts`, and a ref to a file is caught by a
 * push that lists exactly that file).
 */
export function pathMatches(refPath: string, changed: string): boolean {
  if (!refPath || !changed) return false
  const a = refPath.replace(/\/+$/, '')
  const b = changed.replace(/\/+$/, '')
  return a === b || b.startsWith(a + '/') || a.startsWith(b + '/')
}

export type { VcsAdapter, VcsChange }
