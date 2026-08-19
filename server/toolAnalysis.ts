// ── Recovery-chain analysis (pure) ───────────────────────────────────────────
// A single failed call says nothing; the cost is in the RECOVERY — the run of
// calls from a failure to the next success of the same tool. The tool with the
// longest median recovery chain is the worst-designed one, and nobody ever
// reports it, because in the end it works.
//
// cm:guard no DB import, no clock, no randomness. Every result is a function of the rows passed
// in, which is what makes the analysis re-runnable with an identical answer (AC8).

export interface ToolCallLike {
  id: number
  ts: number
  keyId: string
  projectId: string | null
  tool: string
  params: string[]
  outcome: 'ok' | 'error'
}

export interface QuestionLike {
  id: string
  kind: 'question' | 'friction'
  text: string
}

/** A gap longer than this ends the working run: the stateless /mcp transport has
 *  no session id, so an idle period is the only available run boundary. */
export const RUN_IDLE_GAP_MS = 10 * 60 * 1000

export interface Run {
  keyId: string
  projectId: string | null
  calls: ToolCallLike[]
}

export interface ChainStep {
  tool: string
  params: string[]
  outcome: 'ok' | 'error'
}

export interface Chain {
  tool: string
  /** Calls from the failure to the recovering success, inclusive. */
  length: number
  /** false when the run ended without the tool ever succeeding. */
  recovered: boolean
  sequence: ChainStep[]
}

export interface ToolStat {
  tool: string
  calls: number
  /** Recovery chains opened, i.e. failed invocations of this tool. */
  failures: number
  medianChainLength: number
  maxChainLength: number
  /** Chains that never reached a success — the run just ended. */
  unrecovered: number
}

export interface ToolRanking {
  ranking: ToolStat[]
  topChains: Chain[]
  runs: number
  calls: number
}

/** Split rows into working runs, grouped by (keyId, projectId) then cut wherever
 *  the agent went quiet — the only identities a stateless transport leaves behind. */
// cm:why segmented at ANALYSIS time rather than stamped at write time: a server-minted run id
// would need process-local state a container restart or the per-POST rebuild splits anyway.
export function segmentRuns(rows: ToolCallLike[]): Run[] {
  const groups = new Map<string, ToolCallLike[]>()
  for (const r of rows) {
    const key = `${r.keyId} ${r.projectId ?? ''}`
    const g = groups.get(key)
    if (g) g.push(r)
    else groups.set(key, [r])
  }
  const runs: Run[] = []
  for (const key of [...groups.keys()].sort()) {
    const calls = [...groups.get(key)!].sort((a, b) => a.ts - b.ts || a.id - b.id)
    let current: ToolCallLike[] = []
    for (const c of calls) {
      const prev = current.at(-1)
      if (prev && c.ts - prev.ts > RUN_IDLE_GAP_MS) {
        runs.push({ keyId: prev.keyId, projectId: prev.projectId, calls: current })
        current = []
      }
      current.push(c)
    }
    if (current.length) runs.push({ keyId: current[0].keyId, projectId: current[0].projectId, calls: current })
  }
  return runs
}

/**
 * Every recovery chain in one run. The definition, in code:
 *   START  — a call to T whose outcome is 'error'.
 *   END    — the next call to T in the same run whose outcome is 'ok', INCLUSIVE;
 *            if the run has none, the run's last call (recovered: false).
 *   LENGTH — the number of calls between those bounds inclusive, counting calls to
 *            EVERY tool, not just T. The reporter's example
 *            create_snapshot(err), validate_board, update_feature, create_snapshot(ok)
 *            is therefore length 4 — four calls for what should have been one.
 *   OVERLAP — if T fails twice before succeeding, each failure opens its own chain;
 *            the chains overlap on purpose, because each failure cost its own detour.
 */
export function recoveryChains(run: Run): Chain[] {
  const chains: Chain[] = []
  run.calls.forEach((call, i) => {
    if (call.outcome !== 'error') return
    let end = -1
    for (let j = i + 1; j < run.calls.length; j++) {
      if (run.calls[j].tool === call.tool && run.calls[j].outcome === 'ok') {
        end = j
        break
      }
    }
    const recovered = end !== -1
    const last = recovered ? end : run.calls.length - 1
    chains.push({
      tool: call.tool,
      length: last - i + 1,
      recovered,
      sequence: run.calls.slice(i, last + 1).map((c) => ({ tool: c.tool, params: c.params, outcome: c.outcome })),
    })
  })
  return chains
}

/** Sorted; an even count averages the two middles. */
export function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** How many worst-offender chains to quote per tool. */
const CHAINS_PER_TOOL = 3

/**
 * Per-tool ranking, worst-first, plus the literal call sequences behind the top
 * `topN` offenders so a maintainer can tell "fix the API" from "fix the docs".
 * Tools that never failed stay in the ranking with a median of 0 — the ranking is
 * the whole surface, not just the broken part of it.
 */
export function rankTools(rows: ToolCallLike[], topN = 5): ToolRanking {
  const runs = segmentRuns(rows)
  const stats = new Map<string, { calls: number; lengths: number[]; unrecovered: number; chains: Chain[] }>()
  const of = (tool: string) => {
    let s = stats.get(tool)
    if (!s) stats.set(tool, (s = { calls: 0, lengths: [], unrecovered: 0, chains: [] }))
    return s
  }
  for (const row of rows) of(row.tool).calls++
  for (const run of runs) {
    for (const chain of recoveryChains(run)) {
      const s = of(chain.tool)
      s.lengths.push(chain.length)
      s.chains.push(chain)
      if (!chain.recovered) s.unrecovered++
    }
  }

  // cm:guard keep the name tiebreak: without it the order is partial and two equal-median tools
  // can swap places between identical runs, which breaks the re-runnability contract.
  const ranking: ToolStat[] = [...stats.entries()]
    .map(([tool, s]) => ({
      tool,
      calls: s.calls,
      failures: s.lengths.length,
      medianChainLength: median(s.lengths),
      maxChainLength: s.lengths.length ? Math.max(...s.lengths) : 0,
      unrecovered: s.unrecovered,
    }))
    .sort((a, b) => b.medianChainLength - a.medianChainLength || b.failures - a.failures || a.tool.localeCompare(b.tool))

  const topChains = ranking
    .filter((r) => r.failures > 0)
    .slice(0, topN)
    .flatMap((r) =>
      [...stats.get(r.tool)!.chains].sort((a, b) => b.length - a.length || Number(a.recovered) - Number(b.recovered)).slice(0, CHAINS_PER_TOOL),
    )

  return { ranking, topChains, runs: runs.length, calls: rows.length }
}

export interface QuestionCluster {
  signature: string
  count: number
  /** Up to three verbatim questions, so a human can judge the cluster. */
  representatives: string[]
  /** The board field the lexicon blames, or null — a guess would be worse than nothing. */
  missingField: string | null
  /** 'missing' = the schema has no such field. 'present' = it does, so the repeated
   *  question means the field is unread, unfilled or badly surfaced — not a schema gap. */
  fieldStatus: 'missing' | 'present' | null
}

/** What a repeated question means the board cannot answer. Data, not code, so
 *  extending it as questions accrue is not a code change. */
// cm:why hand-written rather than semantic: the embeddings service is unavailable, and a lexicon
// that returns null for an unrecognised cluster is honest where a nearest-neighbour guess is not.
export const KEYWORD_TO_FIELD: { keywords: string[]; field: string; status: 'missing' | 'present' }[] = [
  { keywords: ['owner', 'who', 'assignee', 'assigned', 'responsible'], field: 'feature.owner', status: 'missing' },
  { keywords: ['when', 'deadline', 'due', 'date', 'timeline', 'schedule'], field: 'feature.dueDate', status: 'missing' },
  { keywords: ['priority', 'urgent', 'important', 'first', 'next'], field: 'feature.priority', status: 'missing' },
  { keywords: ['estimate', 'effort', 'size', 'points', 'long'], field: 'feature.estimate', status: 'missing' },
  { keywords: ['acceptance', 'criteria', 'definition', 'done'], field: 'feature.validations (set_acceptance)', status: 'present' },
  { keywords: ['depends', 'dependency', 'blocked', 'prerequisite', 'order'], field: 'feature.dependsOn (add_dependency)', status: 'present' },
  { keywords: ['scope', 'nongoal', 'goal', 'exclude'], field: 'feature.desc (the spec contract)', status: 'present' },
]

// cm:guard no KEYWORD_TO_FIELD keyword may appear here — a stopword'd keyword is a dead lexicon
// entry that silently never matches. `who` and `when` stay out for exactly that reason; test pins it.
const STOPWORDS = new Set([
  'a', 'about', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'can', 'do', 'does', 'for', 'from',
  'get', 'got', 'has', 'have', 'how', 'i', 'if', 'in', 'is', 'it', 'its', 'me', 'my', 'need', 'no', 'not', 'of', 'on', 'one',
  'or', 'our', 'should', 'so', 'some', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'up',
  'use', 'want', 'was', 'we', 'what', 'which', 'will', 'with', 'you', 'your',
])

// cm:why tokens containing a digit are dropped: ids, versions and counts are the parts of a
// question that never repeat, so keeping them would give every question its own cluster.
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/\d/.test(w))
}

/**
 * Group questions by the board field the lexicon blames, falling back to the two
 * most corpus-frequent tokens when nothing matches. Lexical, deterministic, and
 * no better than the corpus it runs on — with a handful of questions the clusters
 * are thin, which is the honest answer until usage accrues.
 */
// cm:why the FIELD is the cluster key, not a token bigram: three ways of asking who owns something
// share only one token, so a bigram would split the very repetition this is meant to surface.
export function clusterQuestions(rows: QuestionLike[]): QuestionCluster[] {
  const questions = rows.filter((r) => r.kind === 'question')
  const freq = new Map<string, number>()
  const tokensOf = new Map<string, string[]>()
  for (const q of questions) {
    const tokens = [...new Set(tokenize(q.text))]
    tokensOf.set(q.id, tokens)
    for (const tk of tokens) freq.set(tk, (freq.get(tk) ?? 0) + 1)
  }

  const clusters = new Map<string, { texts: string[]; hit: FieldHit | null }>()
  for (const q of questions) {
    const tokens = tokensOf.get(q.id)!
    const hit = bestField(new Set(tokens))
    const signature =
      hit?.field ??
      ([...tokens].sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0) || a.localeCompare(b)).slice(0, 2).sort().join(' ') || 'unclassified')
    const c = clusters.get(signature) ?? { texts: [], hit }
    c.texts.push(q.text)
    clusters.set(signature, c)
  }

  return [...clusters.entries()]
    .map(([signature, c]) => ({
      signature,
      count: c.texts.length,
      representatives: c.texts.slice(0, 3),
      missingField: c.hit?.field ?? null,
      fieldStatus: c.hit?.status ?? null,
    }))
    .sort((a, b) => b.count - a.count || a.signature.localeCompare(b.signature))
}

interface FieldHit {
  field: string
  status: 'missing' | 'present'
}

/** Most keyword hits wins; a tie falls back to lexicon order, so the answer is stable. */
function bestField(tokens: Set<string>): FieldHit | null {
  let best: { field: string; status: 'missing' | 'present'; hits: number } | null = null
  for (const entry of KEYWORD_TO_FIELD) {
    const hits = entry.keywords.filter((k) => tokens.has(k)).length
    if (hits > 0 && (!best || hits > best.hits)) best = { field: entry.field, status: entry.status, hits }
  }
  return best ? { field: best.field, status: best.status } : null
}
