// ── Tool-call log (names only) ───────────────────────────────────────────────
// The data source behind recovery-chain analysis. Nobody reports a tool that
// costs three extra calls but eventually works, so the only way to see it is to
// record every call and measure the run from a failure to the next success.
//
// Three things make that recordable at all: deriveToolCall treats an `{error}`
// payload as a failure (KineTrak returns 27 of those and throws only twice, so
// an isError check alone would miss almost every failure), the hook sits on the
// tools/call REQUEST rather than on a tool's callback (so the failures the SDK
// answers by itself are visible too), and it installs itself once per server.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { toolCallRepo, type ToolCallRow } from './infra/repositories'

export type ToolOutcome = 'ok' | 'error'

export interface ToolCallRecord {
  tool: string
  /** Parameter NAMES, sorted and deduped. */
  params: string[]
  outcome: ToolOutcome
  /** The one value read out of `args`: scope identity, exactly what `activity`
   *  already stores per row. Nothing else derived from an argument is recorded. */
  projectId: string | null
}

export interface ToolCallContext {
  orgId: string
  keyId: string
  actor: string
}

export type ToolCallSink = (ctx: ToolCallContext, rec: ToolCallRecord) => void

/** Keep the newest N calls per org — activity's CAP=1000-per-project, scaled for
 *  one row per call rather than one per mutation. */
const CAP = 20_000

/** Rows one analysis pass reads. Equal to CAP, so a full window is readable, and
 *  a result of exactly this length means the window was truncated. */
export const READ_LIMIT = CAP

// cm:why a payload this large is a bulk read (get_board returns the whole board) and never an error
// envelope, so parsing it would burn real CPU on the hot path to learn nothing.
const PAYLOAD_PARSE_CAP = 64 * 1024

// cm:guard `failed` is checked, `ok` deliberately is NOT: validate_board and check_impact return
// ok:false as a REPORT about the board, which is a working tool, not a failed call.
function isFailureEnvelope(parsed: Record<string, unknown>): boolean {
  if (Object.prototype.hasOwnProperty.call(parsed, 'error')) return true
  // cm:edge contract -> server/mcp.ts — bulk_apply reports per-op failure as {ok, applied, failed},
  // never as `error`; without this the batch path the instructions push agents to use scores 'ok'.
  return typeof parsed.failed === 'number' && parsed.failed > 0
}

function isErrorPayload(result: unknown): boolean {
  if (!result || typeof result !== 'object') return false
  const r = result as { isError?: unknown; content?: unknown }
  if (r.isError === true) return true
  if (!Array.isArray(r.content)) return false
  const first = r.content[0] as { type?: unknown; text?: unknown } | undefined
  if (!first || first.type !== 'text' || typeof first.text !== 'string') return false
  if (first.text.length > PAYLOAD_PARSE_CAP) return false
  try {
    const parsed: unknown = JSON.parse(first.text)
    return !!parsed && typeof parsed === 'object' && !Array.isArray(parsed) && isFailureEnvelope(parsed as Record<string, unknown>)
  } catch {
    return false
  }
}

// cm:guard the names-only contract lives here and nowhere else: `args` is read via Object.keys plus
// the single projectId carve-out. Any other read of an argument breaks AC3 and toolLog.test.ts.
export function deriveToolCall(
  tool: string,
  args: unknown,
  result: unknown,
  threw = false,
  /** The project the server would have served for a call that named none. */
  defaultProjectId: string | null = null,
): ToolCallRecord {
  const bag = args && typeof args === 'object' && !Array.isArray(args) ? (args as Record<string, unknown>) : undefined
  const params = bag ? [...new Set(Object.keys(bag))].sort() : []
  const projectId = typeof bag?.projectId === 'string' ? bag.projectId : defaultProjectId
  return { tool, params, outcome: threw || isErrorPayload(result) ? 'error' : 'ok', projectId }
}

// cm:why trimmed every TRIM_EVERY inserts, not every one like activity.ts: a row lands on every
// read as well as every mutation, so trimming per call would triple the queries on the hot path.
const TRIM_EVERY = 500
const sinceTrim = new Map<string, number>()

function dueForTrim(orgId: string): boolean {
  const n = (sinceTrim.get(orgId) ?? 0) + 1
  sinceTrim.set(orgId, n % TRIM_EVERY)
  return n >= TRIM_EVERY
}

function persistToolCall(ctx: ToolCallContext, rec: ToolCallRecord): void {
  toolCallRepo
    .insert({ ...ctx, ...rec, ts: Date.now() })
    .then(() => (dueForTrim(ctx.orgId) ? toolCallRepo.trim(ctx.orgId, CAP) : undefined))
    .catch((e) => console.error('tool call persist failed:', e))
}

export interface InstrumentOptions {
  /** The project id the server resolves for a call that passed none. */
  defaultProjectId?: () => string | null
  sink?: ToolCallSink
}

/** The JSON-RPC method whose handler is wrapped. */
const TOOLS_CALL = 'tools/call'

type RawHandler = (request: unknown, extra: unknown) => Promise<unknown>

/**
 * Record every tool call this server answers. Call it once, AFTER the last
 * `registerTool` — the McpServer installs its tools/call handler on the first
 * registration, and this wraps that handler.
 *
 * Returns false (and logs) if no handler was found, which is the only way the
 * instrument can be silently absent.
 */
// cm:guard the wrapper is transparent by contract: returns the handler's value unchanged, rethrows
// what it throws, never awaits the sink. Instrumentation that changes an outcome is worse than none.
// cm:why the hook sits on the tools/call REQUEST, not on a tool callback: the SDK answers unknown
// tool, disabled tool and schema-validation failures above every callback, so a callback sees none.
// cm:edge contract -> server/toolLog.test.ts — the 'tools/call' name and the SDK-private handler map
// are pinned there against a real client, so an SDK move fails a test instead of recording nothing.
// cm:edge protocol -> server/mcp.ts — call this AFTER the last registerTool: the McpServer installs
// its tools/call handler on the FIRST registration, so hooking earlier finds no handler to wrap.
export function instrumentToolCalls(server: McpServer, ctx: ToolCallContext, opts: InstrumentOptions = {}): boolean {
  const handlers = (server as unknown as { server?: { _requestHandlers?: Map<string, RawHandler> } }).server?._requestHandlers
  const original = handlers?.get(TOOLS_CALL)
  if (!handlers || !original) {
    console.error(`tool-call instrumentation NOT installed: no ${TOOLS_CALL} handler — call it after the first registerTool`)
    return false
  }
  const sink = opts.sink ?? persistToolCall

  const record = (tool: string, args: unknown, result: unknown, threw: boolean) => {
    try {
      sink(ctx, deriveToolCall(tool, args, result, threw, opts.defaultProjectId?.() ?? null))
    } catch (e) {
      console.error('tool call record failed:', e)
    }
  }

  handlers.set(TOOLS_CALL, async (request, extra) => {
    const params = (request as { params?: { name?: unknown; arguments?: unknown } }).params
    // cm:why an unknown tool name is recorded under the name as sent: a call for a tool that does
    // not exist is a failure of the tool SURFACE, and dropping it hides the case worth seeing.
    const tool = typeof params?.name === 'string' ? params.name : 'unknown'
    try {
      const result = await original(request, extra)
      record(tool, params?.arguments, result, false)
      return result
    } catch (e) {
      record(tool, params?.arguments, undefined, true)
      throw e
    }
  })
  return true
}

/** The recorded calls for one org, oldest→newest — the analysis input. Newest
 *  READ_LIMIT rows of the window, so a long history analyses its recent end. */
export function readToolCalls(orgId: string, opts: { projectId?: string; since?: number } = {}): Promise<ToolCallRow[]> {
  return toolCallRepo.range(orgId, { ...opts, limit: READ_LIMIT })
}
