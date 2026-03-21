'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Key, Plus, Copy, Check, Trash2, ToggleLeft, ToggleRight, X, AlertCircle } from 'lucide-react'

interface ApiKeyItem {
  id: string
  name: string
  maskedKey: string
  plan: string
  requestsToday: number
  lastResetAt: string
  enabled: boolean
  createdAt: string
}

interface NewKeyResult {
  id: string
  name: string
  key: string
  plan: string
}

const PLAN_LIMITS: Record<string, number> = { free: 100, pro: 10000 }

export default function ApiKeysPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create modal state
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newKeyResult, setNewKeyResult] = useState<NewKeyResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/api-keys')
      if (!res.ok) throw new Error('Failed to load API keys')
      setKeys(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchKeys()
  }, [status, fetchKeys])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create key')
      setNewKeyResult(data)
      setNewName('')
      fetchKeys()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await fetch(`/api/api-keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, enabled: !enabled } : k)))
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
      setKeys((prev) => prev.filter((k) => k.id !== id))
    } finally {
      setDeleteId(null)
      setDeleting(false)
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function closeCreateModal() {
    setShowCreate(false)
    setNewKeyResult(null)
    setNewName('')
    setCreateError('')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const limit = PLAN_LIMITS

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Key size={18} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">API Keys</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Authenticate programmatic access to Alpha Scanner</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400 active:scale-95"
          >
            <Plus size={13} />
            New Key
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400 mb-6">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && keys.length === 0 && !error && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center">
            <Key size={28} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-400 mb-1">No API keys yet</p>
            <p className="text-xs text-zinc-600">Create your first key to start using the API</p>
          </div>
        )}

        {/* Keys list */}
        {!loading && keys.length > 0 && (
          <div className="space-y-3">
            {keys.map((k) => {
              const dayLimit = limit[k.plan] ?? 100
              const usagePct = Math.min((k.requestsToday / dayLimit) * 100, 100)
              const usageColor = usagePct >= 90 ? 'bg-rose-500' : usagePct >= 70 ? 'bg-yellow-500' : 'bg-emerald-500'
              return (
                <div
                  key={k.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white truncate">{k.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            k.plan === 'pro'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20'
                          }`}
                        >
                          {k.plan}
                        </span>
                        {!k.enabled && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            disabled
                          </span>
                        )}
                      </div>
                      <code className="text-[11px] text-zinc-500 font-mono">{k.maskedKey}</code>

                      {/* Usage bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-zinc-500">
                            {k.requestsToday}/{dayLimit} today
                          </span>
                          <span className="text-[11px] text-zinc-600">
                            {Math.round(usagePct)}%
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${usageColor}`}
                            style={{ width: `${usagePct}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-600 mt-2">
                        Created {new Date(k.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggle(k.id, k.enabled)}
                        title={k.enabled ? 'Disable key' : 'Enable key'}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition"
                      >
                        {k.enabled ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => setDeleteId(k.id)}
                        title="Delete key"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Usage guide */}
        <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Usage</h2>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Pass your key via header:</p>
            <code className="block rounded-lg bg-black/40 border border-white/[0.05] px-4 py-2.5 text-[11px] font-mono text-emerald-300">
              Authorization: Bearer as_your_key_here
            </code>
            <p className="text-xs text-zinc-500 mt-2">Or via query parameter:</p>
            <code className="block rounded-lg bg-black/40 border border-white/[0.05] px-4 py-2.5 text-[11px] font-mono text-emerald-300">
              /api/signals?symbol=XAUUSD&api_key=as_your_key_here
            </code>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Free</p>
              <p className="text-lg font-bold text-white">100</p>
              <p className="text-[11px] text-zinc-600">requests / day</p>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Pro</p>
              <p className="text-lg font-bold text-white">10,000</p>
              <p className="text-[11px] text-zinc-600">requests / day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-6 shadow-2xl">
            {newKeyResult ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Key Created</h2>
                  <button onClick={closeCreateModal} className="text-zinc-500 hover:text-zinc-300 transition">
                    <X size={16} />
                  </button>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-4">
                  <p className="text-xs text-amber-400 font-medium mb-1">Copy your key now — it won't be shown again</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-black/50 border border-white/[0.06] px-3 py-2.5 mb-4">
                  <code className="flex-1 text-[11px] font-mono text-emerald-300 break-all">{newKeyResult.key}</code>
                  <button
                    onClick={() => copyKey(newKeyResult.key)}
                    className="shrink-0 p-1 rounded text-zinc-400 hover:text-white transition"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="w-full rounded-full bg-white/[0.06] py-2 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-white">Create API Key</h2>
                  <button onClick={closeCreateModal} className="text-zinc-500 hover:text-zinc-300 transition">
                    <X size={16} />
                  </button>
                </div>
                <label className="block text-xs text-zinc-400 mb-1.5">Key name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. My Trading Bot"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/40 transition mb-4"
                  autoFocus
                />
                {createError && (
                  <p className="text-xs text-rose-400 mb-3">{createError}</p>
                )}
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="w-full rounded-full bg-emerald-500 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating…' : 'Create Key'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-6 shadow-2xl">
            <h2 className="text-sm font-semibold text-white mb-2">Delete API Key?</h2>
            <p className="text-xs text-zinc-500 mb-5">This action cannot be undone. Any integrations using this key will stop working.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-full border border-white/[0.08] py-2 text-sm text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 rounded-full bg-rose-500 py-2 text-sm font-semibold text-white hover:bg-rose-400 transition disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
