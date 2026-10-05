import {
  LineChart,
  ArrowLeft,
  BookOpen,
  Compass,
  FileText,
  GitBranch,
  Hammer,
  ShieldCheck,
  Rocket,
  Layers,
  FolderPlus,
  Sparkles,
  Terminal,
  Plug,
} from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'

// In-app guide for operating KineTrak with an AI agent. Mirrors docs/AGENT_PLAYBOOK.md
// and docs/SETUP_OTHER_PROJECTS.md so the process is discoverable without leaving the app.

const LIFECYCLE = [
  { icon: <Compass size={16} />, name: 'Orient', desc: 'Recall the board before any edit: get_changes_since / get_board → Project Context → validate_board.' },
  { icon: <FileText size={16} />, name: 'Specify', desc: 'Write the contract into the feature: goal, non-goals, acceptance criteria. Human reviews.' },
  { icon: <GitBranch size={16} />, name: 'Decompose', desc: 'Turn the spec into an ordered swimlane plan (steps + arrows). Human reviews.' },
  { icon: <Hammer size={16} />, name: 'Implement', desc: 'Work one step at a time; flip status and append evidence as you go.' },
  { icon: <ShieldCheck size={16} />, name: 'Validate', desc: 'Fresh-eyes check against the acceptance criteria; record the verdict.' },
  { icon: <Rocket size={16} />, name: 'Ship', desc: 'Promote to done + snapshot. Human-invoked (Tier 4).' },
]

const BROWNFIELD = [
  { tag: 'B0', name: 'Scan', desc: 'Agent reads the repo (tree, manifests, entry points) and builds a compact as-is summary.' },
  { tag: 'B1', name: 'Draft map', desc: 'Additive only: create modules→features mirroring the real code + a Project Context node.' },
  { tag: 'B2', name: 'Human gate', desc: 'You confirm the map matches reality. Then snapshot "v0: as-is".' },
  { tag: 'B3', name: 'Develop', desc: 'Enter the normal lifecycle. After B2, restructuring is Tier 4 — ask first.' },
]

const TIERS = [
  { c: '#9aa2ad', n: 'Tier 1 · Read', rule: 'autonomous', ex: 'get_board · get_changes_since · search · validate_board · next_action · compute_impact · log_activity' },
  { c: '#0d9488', n: 'Tier 2 · Additive', rule: 'proceed + narrate', ex: 'append_note · add_swim_node · add_swim_edge · update_swim_node · arrange_swimlane' },
  { c: '#f59e0b', n: 'Tier 3 · New structure', rule: 'proceed, flag for review', ex: 'add_module · add_feature · update_feature · create_project · reorder_* · create_snapshot' },
  { c: '#e5484d', n: 'Tier 4 · Irreversible', rule: 'stop & get approval first', ex: 'delete_* · ship a feature · wide restructuring · delete a project' },
]

const SKILLS = [
  ['kinetrak-orient', 'Run first each session — recall the board.'],
  ['kinetrak-onboard', 'Map an existing codebase (brownfield) before any change.'],
  ['kinetrak-specify', 'Write the feature contract before code.'],
  ['kinetrak-decompose', 'Turn a spec into an ordered swimlane plan.'],
  ['kinetrak-implement', 'Execute the plan, step by step, with evidence.'],
  ['kinetrak-validate', 'Fresh-eyes review against acceptance criteria.'],
  ['kinetrak-ship', 'Promote + snapshot a validated feature (human-invoked).'],
  ['kinetrak-session-close', 'Write resume state + cursor before stopping.'],
]

const TOOLS: [string, string[]][] = [
  ['Read / recall', ['list_projects', 'get_board', 'get_changes_since', 'search', 'validate_board', 'next_action']],
  ['Projects', ['create_project']],
  ['Modules', ['add_module', 'find_or_create_module', 'update_module', 'delete_module']],
  ['Features', ['add_feature', 'find_or_create_feature', 'update_feature', 'delete_feature']],
  ['Ordering / layout', ['reorder_modules', 'reorder_features', 'move_swim_node', 'arrange_swimlane']],
  ['Swimlane', ['add_swim_node', 'update_swim_node', 'delete_swim_node', 'add_swim_edge', 'delete_swim_edge']],
  ['Impact', ['compute_impact', 'set_impact_threshold']],
  ['Memory / versioning', ['create_snapshot', 'append_note', 'log_activity']],
]

export default function GuidePage() {
  const goHome = useWorkspace((s) => s.goHome)
  const goConnect = useWorkspace((s) => s.goConnect)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbfcfd]">
      <header className="flex h-14 flex-none items-center gap-3 border-b border-line bg-white px-5">
        <button onClick={goHome} className="flex items-center gap-2.5 rounded-lg p-0.5 hover:opacity-80" title="Home">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br from-brand to-brand-light shadow-[0_2px_6px_rgba(47,111,237,.35)]">
            <LineChart size={17} className="text-white" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[15px] font-extrabold tracking-tight">KineTrak</span>
            <span className="mt-[3px] text-[8.5px] font-bold tracking-[2px] text-faint">PLATFORM</span>
          </div>
        </button>
        <div className="h-6 w-px bg-line" />
        <span className="flex items-center gap-1.5 text-[14px] font-bold text-ink">
          <BookOpen size={16} className="text-brand" /> Agent Guide
        </span>
        <div className="flex-1" />
        <button
          onClick={goConnect}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f4f6f9]"
        >
          <Plug size={15} /> Connect agent
        </button>
        <button
          onClick={goHome}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f4f6f9]"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[920px] px-6 py-7">
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Run your project lifecycle with an AI agent</h1>
          <p className="mt-1.5 max-w-[680px] text-[13.5px] leading-relaxed text-muted">
            KineTrak is built to be operated by an AI agent over MCP while you watch every change live. The board is the
            agent’s <span className="font-semibold text-ink">single source of truth and memory</span> — it reads before it
            writes, works additively, and pauses at human gates for anything irreversible.
          </p>

          {/* Lifecycle */}
          <Section icon={<Compass size={15} />} title="The lifecycle" sub="Every piece of work flows through these six steps">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {LIFECYCLE.map((s, i) => (
                <div key={s.name} className="rounded-xl border border-line bg-white p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-brand">{s.icon}</span>
                    <span className="font-mono text-[11px] font-bold text-brand">{i + 1}</span>
                    <span className="text-[13.5px] font-bold text-ink">{s.name}</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted">{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px] text-faint">
              Session bookends: <code className="font-mono">orient</code> reads the board first; <code className="font-mono">session-close</code> writes a
              resume note + cursor so the next session continues incrementally.
            </p>
          </Section>

          {/* Brownfield */}
          <Section icon={<Layers size={15} />} title="Onboarding an existing codebase" sub="The diagram is the output of onboarding, not the tool that performs it">
            <div className="flex flex-col gap-2">
              {BROWNFIELD.map((b) => (
                <div key={b.tag} className="flex items-start gap-3 rounded-lg border border-line bg-white px-3.5 py-2.5">
                  <span className="mt-0.5 flex h-6 w-7 flex-none items-center justify-center rounded-md bg-[#eef1ff] font-mono text-[11px] font-bold text-brand">
                    {b.tag}
                  </span>
                  <div>
                    <span className="text-[13px] font-bold text-ink">{b.name}</span>
                    <p className="text-[12px] leading-relaxed text-muted">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* HITL tiers */}
          <Section icon={<ShieldCheck size={15} />} title="Human-in-the-loop tiers" sub="What the agent does on its own vs. what it must ask about first">
            <div className="flex flex-col gap-2">
              {TIERS.map((t) => (
                <div key={t.n} className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="flex">
                    <div className="w-1 flex-none" style={{ background: t.c }} />
                    <div className="flex-1 px-3.5 py-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-bold text-ink">{t.n}</span>
                        <span className="text-[11.5px] font-semibold" style={{ color: t.c }}>
                          {t.rule}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">{t.ex}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Use on another project */}
          <Section icon={<FolderPlus size={15} />} title="Use it on another project" sub="The playbook rides the MCP server — skills are an optional upgrade">
            <ol className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed text-muted">
              <Step n="1">
                On the <button onClick={goConnect} className="font-semibold text-brand hover:underline">Connect</button> page,
                pick (or create) a workspace and mint an API key scoped to it.
              </Step>
              <Step n="2">
                Add the server once at user scope:{' '}
                <code className="rounded bg-[#f1f3f6] px-1.5 py-0.5 font-mono text-[11px] text-ink">claude mcp add --transport http kinetrak &lt;url&gt; --header "Authorization: Bearer &lt;KEY&gt;" -s user</code>
              </Step>
              <Step n="3">
                Install the skills once at user scope: copy <code className="font-mono">.claude/skills/kinetrak-*</code> and{' '}
                <code className="font-mono">_shared</code> into <code className="font-mono">~/.claude/skills/</code>.
              </Step>
              <Step n="4">
                In the repo, ask the agent to “onboard this codebase into KineTrak” — it calls <code className="font-mono">create_project</code>,
                scans the code, drafts the map, and stops for your B2 confirmation.
              </Step>
            </ol>
            <p className="mt-2 text-[11.5px] text-faint">
              A key is scoped to one workspace. Default to one workspace per area holding several projects (the agent targets
              the right project); use one workspace per project for stronger isolation.
            </p>
          </Section>

          {/* Skills */}
          <Section icon={<Sparkles size={15} />} title="Skills" sub="Claude Code workflows that drive the lifecycle">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SKILLS.map(([name, desc]) => (
                <div key={name} className="rounded-lg border border-line bg-white p-3">
                  <code className="font-mono text-[12px] font-bold text-brand">{name}</code>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Tools */}
          <Section icon={<Terminal size={15} />} title="Tool reference" sub="Everything the agent can call over MCP">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TOOLS.map(([title, items]) => (
                <div key={title} className="rounded-lg border border-line bg-white p-3">
                  <div className="text-[12.5px] font-bold text-ink">{title}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {items.map((t) => (
                      <code key={t} className="rounded bg-[#f1f3f6] px-1.5 py-0.5 font-mono text-[10.5px] text-muted">
                        {t}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  )
}

function Section({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-center gap-2">
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

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand font-mono text-[10.5px] font-bold text-white">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}
