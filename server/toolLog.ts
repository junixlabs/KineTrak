// ── Tool-call log (names only) ───────────────────────────────────────────────
// The data source behind recovery-chain analysis. Nobody reports a tool that
// costs three extra calls but eventually works, so the only way to see it is to
// record every call and measure the run from a failure to the next success.
//
// Two things make that recordable at all: deriveToolCall treats an `{error}`
// payload as a failure (KineTrak returns 27 of those and throws only twice, so
// an isError check alone would miss almost every failure), and the wrapper below
// installs itself once per server rather than at 66 call sites.

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

// cm:why a payload this large is a bulk read (get_board returns the whole board) and never an error
// envelope, so parsing it would burn real CPU on the hot path to learn nothing.
const PAYLOAD_PARSE_CAP = 64 * 1024

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
    return !!parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.prototype.hasOwnProperty.call(parsed, 'error')
  } catch {
    return false
  }
}

// cm:guard the names-only contract lives here and nowhere else: `args` is read via Object.keys plus
// the single projectId carve-out. Any other read of an argument breaks AC3 and toolLog.test.ts.
export function deriveToolCall(tool: string, args: unknown, result: unknown, threw = false): ToolCallRecord {
  const bag = args && typeof args === 'object' && !Array.isArray(args) ? (args as Record<string, unknown>) : undefined
  const params = bag ? [...new Set(Object.keys(bag))].sort() : []
  const projectId = typeof bag?.projectId === 'string' ? bag.projectId : null
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

// cm:why the SDK resolves a tool's callback type from its inputSchema (ToolCallback<Args>), which a
// wrapper cannot reproduce generically — this keeps that loosening in one file, not 66 call sites.
type ErasedHandler = (...a: unknown[]) => unknown
type ErasedRegisterTool = (name: string, config: { inputSchema?: unknown } | undefined, handler: unknown) => unknown

/**
 * Record every tool this server registers from here on. Call it once, right after
 * `new McpServer(...)` and above the registrations — that covers both transports,
 * because mcp-stdio.ts builds its server through the same function.
 */
// cm:guard the wrapper is transparent by contract: returns the handler's value unchanged, rethrows
// what it throws, never awaits the sink. Instrumentation that changes an outcome is worse than none.
// cm:edge protocol -> server/mcp.ts — must run BEFORE the first server.registerTool call in
// buildMcpServer; a tool registered above that line is silently invisible to the analysis.
export function instrumentToolRegistration(server: McpServer, ctx: ToolCallContext, sink: ToolCallSink = persistToolCall): void {
  const target = server as unknown as { registerTool: ErasedRegisterTool }
  const original = target.registerTool.bind(server) as ErasedRegisterTool

  target.registerTool = (name, config, handler) => {
    // cm:why a task-based handler is an object, not a function (the SDK dispatches on `createTask`);
    // KineTrak registers none, and passing one through beats mis-wrapping it.
    if (typeof handler !== 'function') return original(name, config, handler)
    const call = handler as ErasedHandler

    const record = (args: unknown, result: unknown, threw: boolean) => {
      try {
        sink(ctx, deriveToolCall(name, args, result, threw))
      } catch (e) {
        console.error('tool call record failed:', e)
      }
    }
    const run = async (args: unknown, invoke: () => unknown) => {
      try {
        const result = await invoke()
        record(args, result, false)
        return result
      } catch (e) {
        record(args, undefined, true)
        throw e
      }
    }

    // cm:edge contract -> server/mcp.ts — the SDK calls a schema-less tool as handler(extra) and a
    // schema'd one as handler(args, extra); branching on the same inputSchema keeps the two in step.
    const wrapped = config?.inputSchema
      ? (args: unknown, extra: unknown) => run(args, () => call(args, extra))
      : (extra: unknown) => run(undefined, () => call(extra))

    return original(name, config, wrapped)
  }
}

/** The recorded calls for one org, oldest→newest — the analysis input. */
export function readToolCalls(orgId: string, opts: { projectId?: string; since?: number } = {}): Promise<ToolCallRow[]> {
  return toolCallRepo.range(orgId, opts)
}
