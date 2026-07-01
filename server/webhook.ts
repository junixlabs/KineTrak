import type { Express, Request, Response } from 'express'
import { applyAndBroadcast, getProject, projectHeader } from './state'
import { recordNote, type Actor } from './activity'
import { getAdapter, listProviders, pathMatches } from './integrations/vcs'
import { makeId } from '../src/store/ids'

// ── VCS webhook ingestion ────────────────────────────────────────────────────
// POST /api/webhook/:provider?projectId=…  — a provider-specific push/merge event
// is verified (per-adaptor secret), normalized, and matched against the codeRefs
// on the target project's features/steps. Matches are flagged `codeStale` so the
// board derives live "outdated" alerts (see src/lib/impact.deriveOutdatedAlerts).
// The webhook authenticates via the shared secret (not an API key); projectId in
// the query selects the board — this is how the user wires the hook per project.

function normalizeHeaders(req: Request): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(req.headers)) out[k.toLowerCase()] = Array.isArray(v) ? v[0] : v
  return out
}

function secretFor(provider: string): string | undefined {
  return (
    process.env[`KINETRAK_WEBHOOK_SECRET_${provider.toUpperCase()}`] ||
    process.env.KINETRAK_WEBHOOK_SECRET ||
    undefined
  )
}

export function registerWebhooks(app: Express) {
  app.get('/api/webhook/providers', (_req, res) => res.json({ providers: listProviders() }))

  app.post('/api/webhook/:provider', async (req: Request, res: Response) => {
    const provider = String(req.params.provider)
    const adapter = getAdapter(provider)
    if (!adapter) return res.status(404).json({ ok: false, error: `unknown provider "${provider}"` })

    const rawBody: Buffer = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}))
    const headers = normalizeHeaders(req)
    if (!adapter.verify(rawBody, headers, secretFor(provider)))
      return res.status(401).json({ ok: false, error: 'webhook signature verification failed' })

    const change = adapter.parse(req.body, headers)
    if (!change) return res.json({ ok: true, ignored: true })

    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
    if (!projectId || !projectHeader(projectId))
      return res.status(400).json({ ok: false, error: 'pass ?projectId=<board id> that this webhook feeds' })

    const p = await getProject(projectId)
    if (!p) return res.status(404).json({ ok: false, error: 'project not found' })

    const targets: { target: 'feature' | 'swimnode'; id: string }[] = []
    const matched = (refs: { path: string }[] | undefined) => (refs ?? []).some((r) => change.changedPaths.some((c) => pathMatches(r.path, c)))
    for (const f of p.data.features) if (matched(f.codeRefs)) targets.push({ target: 'feature', id: f.id })
    for (const n of p.data.swimNodes) if (matched(n.codeRefs)) targets.push({ target: 'swimnode', id: n.id })

    const actor: Actor = { kind: 'agent', name: `${provider} webhook` }
    if (targets.length) {
      await applyAndBroadcast({ type: 'markCodeStale', projectId, targets, stale: true }, actor)
      recordNote(
        projectId,
        actor,
        `${provider} push ${change.headSha?.slice(0, 8) ?? ''} flagged ${targets.length} node(s) as outdated: ${change.changedPaths.slice(0, 5).join(', ')}${change.changedPaths.length > 5 ? '…' : ''}`,
      )
    }
    return res.json({ ok: true, matched: targets.length, changedPaths: change.changedPaths.length, headSha: change.headSha, event: makeId('wh') })
  })
}
