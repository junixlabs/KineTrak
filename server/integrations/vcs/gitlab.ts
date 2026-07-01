import { timingSafeEqual } from 'node:crypto'
import { header, type VcsAdapter, type VcsChange } from './types'

// GitLab webhook adaptor.
// - Auth: a plain shared token sent as `X-Gitlab-Token` (constant-time compared).
// - Events: we consume `Push Hook` (commits carry added/modified/removed paths).

interface PushCommit {
  added?: string[]
  modified?: string[]
  removed?: string[]
  message?: string
  url?: string
}
interface PushPayload {
  ref?: string
  checkout_sha?: string
  commits?: PushCommit[]
  project?: { web_url?: string }
}

export const gitlabAdapter: VcsAdapter = {
  provider: 'gitlab',

  verify(_rawBody, headers, secret) {
    if (!secret) return true
    const token = header(headers, 'x-gitlab-token')
    if (!token) return false
    const a = Buffer.from(token)
    const b = Buffer.from(secret)
    return a.length === b.length && timingSafeEqual(a, b)
  },

  parse(payload, headers) {
    const event = header(headers, 'x-gitlab-event')
    if (event && event !== 'Push Hook') return null
    const p = payload as PushPayload
    if (!p || !Array.isArray(p.commits)) return null
    const paths = new Set<string>()
    let title: string | undefined
    let url: string | undefined
    for (const c of p.commits) {
      for (const f of c.added ?? []) paths.add(f)
      for (const f of c.modified ?? []) paths.add(f)
      for (const f of c.removed ?? []) paths.add(f)
      title ??= c.message
      url ??= c.url
    }
    if (paths.size === 0) return null
    return {
      provider: 'gitlab',
      ref: p.ref,
      headSha: p.checkout_sha,
      url: url ?? p.project?.web_url,
      title,
      changedPaths: [...paths],
    } satisfies VcsChange
  },
}
