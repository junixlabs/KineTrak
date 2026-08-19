// ── Question / friction archive ──────────────────────────────────────────────
// Clustering recurring ask_human questions finds the board fields the schema is
// missing — but only if the corpus survives, and board alerts do not:
// resolve_question deletes them. So a row is archived when the alert is CREATED.
// The reducer stays pure and its dismissal path stays exactly as destructive as
// it was; nothing about resolve_question had to change.

import type { Command } from '../src/shared/board'
import { agentQuestionRepo, type AgentQuestionRow } from './infra/repositories'

// cm:edge lockstep -> src/shared/board.ts — askHuman / answerQuestion / reportFriction are handled
// on both sides; a new alert-producing command must be archived here or its text dies on dismissal.
// cm:why deliberately stores TEXT, unlike the names-only tool_calls log: a cluster cannot be
// computed from a count. The two feeds never cross — this one never sees tool arguments.
export function archivedQuestion(cmd: Command, now: number): Omit<AgentQuestionRow, 'answer'> | null {
  switch (cmd.type) {
    case 'askHuman':
      return {
        id: cmd.id,
        projectId: cmd.projectId,
        kind: 'question',
        askedAt: now,
        text: cmd.question + (cmd.options?.length ? `\nOptions: ${cmd.options.join(' / ')}` : ''),
        tool: null,
      }
    case 'reportFriction':
      return {
        id: cmd.id,
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

/** Fire-and-forget, like activity narration: a lost archive row must never fail
 *  the board command that produced the alert. */
export function archiveAlert(cmd: Command, now = Date.now()): void {
  if (cmd.type === 'answerQuestion') {
    agentQuestionRepo.answer(cmd.id, cmd.answer).catch((e) => console.error('question answer archive failed:', e))
    return
  }
  const row = archivedQuestion(cmd, now)
  if (row) agentQuestionRepo.insert(row).catch((e) => console.error('question archive failed:', e))
}

/** The corpus for a set of projects, oldest→newest — the clustering input. */
export function readQuestions(projectIds: string[], since?: number): Promise<AgentQuestionRow[]> {
  return agentQuestionRepo.byProjects(projectIds, since)
}
