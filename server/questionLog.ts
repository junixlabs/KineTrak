// ── Question / friction archive ──────────────────────────────────────────────
// Clustering recurring ask_human questions finds the board fields the schema is
// missing — but only if the corpus survives, and board alerts do not:
// resolve_question deletes them. So a row is archived when the alert is CREATED.
// The reducer stays pure and its dismissal path stays exactly as destructive as
// it was; nothing about resolve_question had to change.
//
// A dismissal also archives whatever the board still holds, which is what covers
// the alerts that were already on boards before this table existed.

import type { Command } from '../src/shared/board'
import type { Alert } from '../src/store/types'
import { agentQuestionRepo, type AgentQuestionRow } from './infra/repositories'

/** Keep the newest N archived alerts per org (CONVENTIONS invariant 6: anything
 *  append-only must be bounded). Deliberately generous — the corpus IS the value. */
const CAP = 50_000

type ArchiveRow = Omit<AgentQuestionRow, 'answer'>

// cm:edge lockstep -> src/shared/board.ts — askHuman / answerQuestion / reportFriction are handled
// on both sides; a new alert-producing command must be archived here or its text dies on dismissal.
// cm:why deliberately stores TEXT, unlike the names-only tool_calls log: a cluster cannot be
// computed from a count. The two feeds never cross — this one never sees tool arguments.
export function archivedQuestion(cmd: Command, orgId: string, now: number): ArchiveRow | null {
  switch (cmd.type) {
    case 'askHuman':
      return {
        id: cmd.id,
        orgId,
        projectId: cmd.projectId,
        kind: 'question',
        askedAt: now,
        text: cmd.question + (cmd.options?.length ? `\nOptions: ${cmd.options.join(' / ')}` : ''),
        tool: null,
      }
    case 'reportFriction':
      return {
        id: cmd.id,
        orgId,
        projectId: cmd.projectId,
        kind: 'friction',
        askedAt: now,
        text: [`Wanted: ${cmd.wanted}`, `Tried: ${cmd.tried}`, `Got: ${cmd.received}`, `Workaround: ${cmd.workaround}`].join('\n'),
        tool: cmd.tool,
      }
    default:
      return null
  }
}

/**
 * The same row derived from a live board alert instead of the command that raised
 * it — the archive path for an alert that predates this table. Only the two
 * archivable kinds map; every other alert kind is derived from the board, not
 * stored on it, and has nothing to lose.
 */
// cm:edge contract -> src/shared/board.ts — `detail` is where the askHuman / reportFriction reducers
// render the text, so it is the only copy an already-raised alert still carries.
export function archivedAlert(alert: Alert, orgId: string, projectId: string, now: number): ArchiveRow | null {
  if (alert.kind !== 'question' && alert.kind !== 'friction') return null
  return {
    id: alert.id,
    orgId,
    projectId,
    kind: alert.kind,
    askedAt: now,
    text: alert.detail,
    tool: alert.kind === 'friction' ? (alert.title.split('·')[1]?.trim() ?? null) : null,
  }
}

export interface ArchiveContext {
  /** The org the project belongs to; without it nothing can be written scoped. */
  orgId: string | undefined
  /** The board's alerts BEFORE the command applied — read on a dismissal. */
  alerts?: Alert[]
  now?: number
}

let trimCountdown = 0

function persist(row: ArchiveRow): void {
  agentQuestionRepo
    .insert(row)
    .then(() => (++trimCountdown % 500 === 0 ? agentQuestionRepo.trim(row.orgId, CAP) : undefined))
    .catch((e) => console.error('question archive failed:', e))
}

/**
 * Fire-and-forget, like activity narration: a lost archive row must never fail the
 * board command that produced the alert.
 *
 * askHuman / reportFriction archive the text; answerQuestion records the answer;
 * resolveQuestion archives the alert it is about to delete, in case it was raised
 * before this table existed (the create-time row wins — the insert is idempotent).
 */
export function archiveAlert(cmd: Command, ctx: ArchiveContext): void {
  const projectId = (cmd as { projectId?: string }).projectId
  const now = ctx.now ?? Date.now()
  if (cmd.type === 'answerQuestion') {
    if (!projectId) return
    agentQuestionRepo
      .answer({ orgId: ctx.orgId, projectId, id: cmd.id }, cmd.answer)
      // cm:why a 0-row update is LOGGED rather than swallowed: it means the question was raised
      // before this table existed, and silence there is what makes a lost corpus look healthy.
      .then((updated) => (updated ? undefined : console.error(`question answer archive matched no row (${cmd.id})`)))
      .catch((e) => console.error('question answer archive failed:', e))
    return
  }
  if (!ctx.orgId) {
    console.error(`question archive skipped, no org resolved for ${cmd.type}`)
    return
  }
  if (cmd.type === 'resolveQuestion') {
    const alert = ctx.alerts?.find((a) => a.id === cmd.id)
    const row = alert && projectId ? archivedAlert(alert, ctx.orgId, projectId, now) : null
    if (row) persist(row)
    return
  }
  const row = archivedQuestion(cmd, ctx.orgId, now)
  if (row) persist(row)
}

/** The corpus for one org, oldest→newest — the clustering input. */
export function readQuestions(orgId: string, opts: { projectId?: string; since?: number } = {}): Promise<AgentQuestionRow[]> {
  return agentQuestionRepo.byOrg(orgId, opts)
}
