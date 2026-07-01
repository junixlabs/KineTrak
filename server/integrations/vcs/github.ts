import { createHmac, timingSafeEqual } from 'node:crypto'
import { header, type VcsAdapter, type VcsChange } from './types'

// GitHub webhook adaptor.
// - Auth: HMAC-SHA256 of the raw body keyed by the shared secret, sent as
//   `X-Hub-Signature-256: sha256=<hex>`.
// - Events: we consume `push` (its commits carry added/modified/removed paths).
//   Other events (ping, pull_request without file lists, tags) normalize to null.

interface PushCommit {
  added?: string[]
  modified?: string[]
  removed?: string[]
}
interface PushPayload {
  ref?: string
  after?: string
  compare?: string
  head_commit?: { message?: string; url?: string } | null
  commits?: PushCommit[]
}

export const githubAdapter: VcsAdapter = {
  provider: 'github',

  verify(rawBody, headers, secret) {
    if (!secret) return true // opt-in: no secret configured → accept (dev)
    const sig = header(headers, 'x-hub-signature-256')
    if (!sig || !sig.startsWith('sha256=')) return false
    const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  },

  parse(payload, headers) {
    const event = header(headers, 'x-github-event')
    if (event && event !== 'push') return null
    const p = payload as PushPayload
    if (!p || !Array.isArray(p.commits)) return null
    const paths = new Set<string>()
    for (const c of p.commits) {
      for (const f of c.added ?? []) paths.add(f)
      for (const f of c.modified ?? []) paths.add(f)
      for (const f of c.removed ?? []) paths.add(f)
    }
    if (paths.size === 0) return null
    return {
      provider: 'github',
      ref: p.ref,
      headSha: p.after,
      url: p.head_commit?.url ?? p.compare,
      title: p.head_commit?.message,
      changedPaths: [...paths],
    } satisfies VcsChange
  },
}
