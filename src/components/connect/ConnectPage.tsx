import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  ArrowLeft,
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  Terminal,
  Braces,
  Plug,
  RefreshCw,
} from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import { useToast } from '@/store/useToast'
import { SYNC_URL, authFetch } from '@/store/api'

interface ApiKey {
  id: string
  orgId: string
  name: string
  key: string
  createdAt: string
  lastUsedAt: string | null
}

const MCP_URL = `${SYNC_URL.replace(/\/$/, '')}/mcp`

const mask = (k: string) => (k.length <= 14 ? k : `${k.slice(0, 11)}${'•'.repeat(10)}${k.slice(-4)}`)
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—')

export default function ConnectPage() {
  const goHome = useWorkspace((s) => s.goHome)
  const orgs = useWorkspace((s) => s.orgs)
  const activeProject = useWorkspace((s) => s.activeProject())
  const show = useToast((s) => s.show)

  // Keys are scoped to one workspace (org). Default to the active project's org.
  const [orgId, setOrgId] = useState<string>(activeProject?.orgId ?? orgs[0]?.id ?? '')
  useEffect(() => {
    if (!orgId && orgs[0]) setOrgId(orgs[0].id)
  }, [orgs, orgId])

  const [loading, setLoading] = useState(true)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const refresh = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const res = await authFetch(`/api/keys?orgId=${encodeURIComponent(orgId)}`)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setKeys(Array.isArray(data.keys) ? data.keys : [])
    } catch {
      setKeys([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createKey = async () => {
    if (!orgId) return
    setCreating(true)
    try {
      const res = await authFetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, name: newName.trim() || 'Agent key' }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setNewName('')
      if (data?.key?.id) setRevealed((r) => ({ ...r, [data.key.id]: true }))
      show('API key created — copy it into your agent config')
      await refresh()
    } catch {
      show('Could not create key')
    } finally {
      setCreating(false)
    }
  }

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this key? Agents using it will lose access immediately.')) return
    try {
      const res = await authFetch(`/api/keys/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      show('Key revoked')
      await refresh()
    } catch {
      show('Could not revoke key')
    }
  }

  const orgName = orgs.find((o) => o.id === orgId)?.name ?? 'this workspace'
  // The key embedded in the copy-paste snippets: the newest one for this org, else a placeholder.
  const sampleKey = useMemo(() => keys[0]?.key ?? '<YOUR_API_KEY>', [keys])

  const cliSnippet = `claude mcp add --transport http kinetrak ${MCP_URL} --header "Authorization: Bearer ${sampleKey}"`
  const jsonSnippet = JSON.stringify(
    { mcpServers: { kinetrak: { type: 'http', url: MCP_URL, headers: { Authorization: `Bearer ${sampleKey}` } } } },
    null,
    2,
  )

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbfcfd]">
      {/* Top bar */}
      <header className="flex h-14 flex-none items-center gap-3 border-b border-line bg-white px-5">
        <button onClick={goHome} className="flex items-center gap-2.5 rounded-lg p-0.5 hover:opacity-80" title="Home">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br from-brand to-brand-light shadow-[0_2px_6px_rgba(47,111,237,.35)]">
            <LineChart size={17} className="text-white" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[15px] font-extrabold tracking-tight">KineTrak</span>
            <span className="mt-0.5 text-[8.5px] font-bold tracking-[2px] text-faint">PLATFORM</span>
          </div>
        </button>
        <div className="h-6 w-px bg-line" />
        <span className="flex items-center gap-1.5 text-[14px] font-bold text-ink">
          <Plug size={16} className="text-brand" /> Connect an agent
        </span>
        <div className="flex-1" />
        <button
          onClick={() => void refresh()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted hover:bg-[#f4f6f9]"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={goHome}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f4f6f9]"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[860px] px-6 py-7">
          {/* Intro */}
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Connect an AI agent over MCP</h1>
          <p className="mt-1.5 max-w-[640px] text-[13.5px] leading-relaxed text-muted">
            KineTrak exposes its board to AI agents through the{' '}
            <span className="font-semibold text-ink">Model Context Protocol</span> over Streamable HTTP. An agent can read
            the full board as context, edit modules / features / swimlane steps, and append notes — every change appears
            live in the browser. Each API key is scoped to one workspace, so an agent only ever sees that workspace.
          </p>

          {/* Endpoint */}
          <Section icon={<Plug size={15} />} title="MCP endpoint" sub="Streamable HTTP — point your agent here">
            <CopyField value={MCP_URL} mono onCopy={() => show('Endpoint copied')} />
          </Section>

          {/* API keys */}
          <Section icon={<KeyRound size={15} />} title="API keys" sub="Each key authorizes an agent for one workspace">
            <Banner tone="ok" icon={<ShieldCheck size={16} />}>
              The <code className="font-mono">/mcp</code> endpoint always requires a valid key. A key acts as your account,
              limited to the selected workspace’s projects.
            </Banner>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] outline-none focus:border-brand"
                title="Workspace this key can access"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !creating && orgId && createKey()}
                placeholder="Key name (e.g. Claude Desktop, CI agent)"
                className="h-9 flex-1 rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-brand"
              />
              <button
                onClick={createKey}
                disabled={creating || !orgId}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(47,111,237,.30)] hover:bg-brand-dark disabled:opacity-50"
              >
                <Plus size={15} strokeWidth={2.5} /> New key
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {keys.length === 0 && !loading && (
                <div className="rounded-lg border border-dashed border-line py-8 text-center text-[12.5px] text-faint">
                  No keys for <b>{orgName}</b> yet. Create one to authorize an agent.
                </div>
              )}
              {keys.map((k) => (
                <div key={k.id} className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#eef1ff] text-brand">
                    <KeyRound size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-[13px] font-bold text-ink">{k.name}</span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <code className="truncate font-mono text-[11.5px] text-muted">
                        {revealed[k.id] ? k.key : mask(k.key)}
                      </code>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-faint">
                      created {fmt(k.createdAt)} · last used {fmt(k.lastUsedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-faint hover:bg-[#f4f6f9] hover:text-ink"
                    title={revealed[k.id] ? 'Hide' : 'Reveal'}
                  >
                    {revealed[k.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <CopyButton value={k.key} onCopy={() => show('Key copied')} />
                  <button
                    onClick={() => revokeKey(k.id)}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-faint hover:bg-[#fdecec] hover:text-[#e5484d]"
                    title="Revoke key"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] leading-snug text-faint">
              Keys are stored on the server, never in the browser or in synced board state. Treat them like passwords —
              revoke any key to cut off its agent immediately.
            </p>
          </Section>

          {/* Snippets */}
          <Section icon={<Terminal size={15} />} title="Claude Code (CLI)" sub="Add the server in one command">
            <CodeBlock value={cliSnippet} onCopy={() => show('Command copied')} />
          </Section>

          <Section
            icon={<Braces size={15} />}
            title="Config file (.mcp.json / Claude Desktop)"
            sub="Paste into your MCP client config"
          >
            <CodeBlock value={jsonSnippet} onCopy={() => show('Config copied')} />
          </Section>

          {keys.length > 0 && (
            <p className="-mt-2 mb-6 text-[11.5px] text-faint">
              Snippets embed your newest key for <b>{orgName}</b>. Swap in any key above, or replace it with{' '}
              <code className="font-mono">&lt;YOUR_API_KEY&gt;</code> when sharing.
            </p>
          )}

          {/* What the agent can do */}
          <Section icon={<ShieldCheck size={15} />} title="What the agent can do" sub="Tools exposed over MCP">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ToolCard title="Read / recall" items={['list_projects', 'get_board', 'search']} />
              <ToolCard title="Modules" items={['add_module', 'update_module', 'delete_module']} />
              <ToolCard title="Features" items={['add_feature', 'update_feature', 'delete_feature']} />
              <ToolCard
                title="Swimlane"
                items={['add_swim_node', 'update_swim_node', 'delete_swim_node', 'add/delete_swim_edge']}
              />
              <ToolCard title="Versioning / memory" items={['create_snapshot', 'append_note']} />
            </div>
          </Section>
        </div>
      </main>
    </div>
  )
}

// ── Small building blocks ────────────────────────────────────────────────────

function Section({
  icon,
  title,
  sub,
  children,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#eef1ff] text-brand">{icon}</span>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-bold text-ink">{title}</span>
          <span className="text-[11.5px] text-faint">{sub}</span>
        </div>
      </div>
      {children}
    </section>
  )
}

function Banner({ tone, icon, children }: { tone: 'ok' | 'warn' | 'info'; icon: React.ReactNode; children: React.ReactNode }) {
  const styles = {
    ok: { bg: '#e7f6ee', color: '#0f7a44', bd: '#bce7cf' },
    warn: { bg: '#fdecec', color: '#b4252a', bd: '#f5c6c7' },
    info: { bg: '#fef3e2', color: '#8a6d1f', bd: '#f6e0b5' },
  }[tone]
  return (
    <div
      className="mt-2 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[12.5px] leading-snug"
      style={{ background: styles.bg, color: styles.color, borderColor: styles.bd }}
    >
      <span className="mt-px flex-none">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function CopyButton({ value, onCopy }: { value: string; onCopy?: () => void }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setDone(true)
      onCopy?.()
      setTimeout(() => setDone(false), 1400)
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      onClick={copy}
      className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-faint hover:bg-[#eef1ff] hover:text-brand"
      title="Copy"
    >
      {done ? <Check size={15} className="text-[#16a34a]" /> : <Copy size={15} />}
    </button>
  )
}

function CopyField({ value, mono, onCopy }: { value: string; mono?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
      <code className={`flex-1 truncate text-[13px] text-ink ${mono ? 'font-mono' : ''}`}>{value}</code>
      <CopyButton value={value} onCopy={onCopy} />
    </div>
  )
}

function CodeBlock({ value, onCopy }: { value: string; onCopy?: () => void }) {
  return (
    <div className="relative rounded-lg border border-line bg-[#0f1320]">
      <pre className="overflow-x-auto p-3.5 pr-12 text-[12px] leading-relaxed text-[#dfe6f5]">
        <code className="font-mono">{value}</code>
      </pre>
      <div className="absolute right-2 top-2">
        <span className="text-white/80">
          <CopyButton value={value} onCopy={onCopy} />
        </span>
      </div>
    </div>
  )
}

function ToolCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <div className="text-[12.5px] font-bold text-ink">{title}</div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {items.map((t) => (
          <code key={t} className="rounded bg-[#f1f3f6] px-1.5 py-0.5 font-mono text-[10.5px] text-muted">
            {t}
          </code>
        ))}
      </div>
    </div>
  )
}
