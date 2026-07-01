// ── VCS integration layer (adaptor pattern) ─────────────────────────────────
// Each provider (GitHub, GitLab, …) is an adaptor that (1) verifies a webhook's
// authenticity and (2) normalizes its wildly different payload into one shape the
// rest of KineTrak understands. Adding a provider = one new file implementing
// VcsAdapter + a line in ./index — nothing else in the codebase changes.

/** A provider-agnostic "some code moved" event distilled from a raw webhook. */
export interface VcsChange {
  provider: string
  /** git ref that moved (e.g. refs/heads/main). */
  ref?: string
  /** New head commit sha after the push/merge. */
  headSha?: string
  /** Link back to the PR / compare / commit. */
  url?: string
  /** PR title or head commit message. */
  title?: string
  /** Repo-relative file paths added/modified/removed by this event. */
  changedPaths: string[]
}

export interface VcsAdapter {
  readonly provider: string
  /**
   * Verify the request is genuinely from the provider, using the raw (unparsed)
   * body + headers + the configured secret. Returns true when authentic. When no
   * secret is configured, returns true (dev/opt-in) — the caller decides policy.
   */
  verify(rawBody: Buffer, headers: Record<string, string | undefined>, secret?: string): boolean
  /**
   * Turn an already-parsed, already-verified payload into a normalized change,
   * or null when the event carries no file changes we care about (pings, tags…).
   */
  parse(payload: unknown, headers: Record<string, string | undefined>): VcsChange | null
}

/** Read a header case-insensitively from a normalized (lower-cased) header bag. */
export function header(headers: Record<string, string | undefined>, name: string): string | undefined {
  return headers[name.toLowerCase()]
}
