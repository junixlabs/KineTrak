import { useState } from 'react'
import { LineChart, Loader2 } from 'lucide-react'
import { login, register } from '@/store/auth'

type Mode = 'login' | 'register'

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = mode === 'login' ? await login(email, password) : await register(email, name, password)
    setBusy(false)
    if (!res.ok) setError(res.error ?? 'Something went wrong')
    // On success the store flips currentUser and App swaps in the workspace.
  }

  return (
    <div className="flex h-full items-center justify-center bg-[#f6f8fb] px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex flex-col items-center gap-2.5">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-[0_4px_12px_rgba(47,111,237,.35)]">
            <LineChart size={23} className="text-white" strokeWidth={2.4} />
          </div>
          <div className="text-center leading-none">
            <div className="text-[19px] font-extrabold tracking-tight">KineTrak</div>
            <div className="mt-1 text-[9px] font-bold tracking-[2.5px] text-faint">PLATFORM</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <h1 className="text-[17px] font-bold text-ink">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
          <p className="mt-1 text-[12.5px] text-faint">
            {mode === 'login' ? 'Welcome back to your workspace.' : 'Start a private workspace for you and your agents.'}
          </p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
            {mode === 'register' && (
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13.5px] outline-none focus:border-brand"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>

            {error && (
              <div className="rounded-lg border border-[#f5c6c7] bg-[#fdecec] px-3 py-2 text-[12.5px] text-[#b4252a]">{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand text-[13.5px] font-bold text-white shadow-[0_2px_6px_rgba(47,111,237,.30)] hover:bg-brand-dark disabled:opacity-60"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 text-center text-[12.5px] text-faint">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <button onClick={() => { setMode('register'); setError(null) }} className="font-bold text-brand hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(null) }} className="font-bold text-brand hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-bold uppercase tracking-wide text-faint">{label}</span>
      {children}
    </label>
  )
}
