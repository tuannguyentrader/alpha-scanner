'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash, PencilSimple, Eye, EyeSlash, CurrencyDollar, ShoppingCart, Package } from '@phosphor-icons/react'

interface MyListing {
  id: string
  name: string
  description: string
  price: number
  assetType: string
  isPublished: boolean
  winRate: number | null
  purchaseCount: number
  createdAt: string
}

interface Purchase {
  id: string
  purchasedAt: string
  listing: {
    id: string
    name: string
    price: number
    indicatorsConfig: string
    backtestResults: string
    author: { name: string | null; email: string }
  }
}

interface Earnings {
  total: number
  byListing: { listingId: string; name: string; price: number; count: number; earnings: number }[]
}

type Tab = 'listings' | 'earnings' | 'purchases'

// Create / edit form
function ListingForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<MyListing & { indicatorsConfig: string; backtestResults: string }>
  onSave: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [assetType, setAssetType] = useState(initial?.assetType ?? 'crypto')
  const [indicatorsConfig, setIndicatorsConfig] = useState(initial?.indicatorsConfig ?? '{}')
  const [backtestResults, setBacktestResults] = useState(initial?.backtestResults ?? '{}')
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!initial?.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    let configParsed: unknown, backtestParsed: unknown
    try {
      configParsed = JSON.parse(indicatorsConfig)
    } catch {
      setError('Invalid JSON in indicators config')
      setSaving(false)
      return
    }
    try {
      backtestParsed = JSON.parse(backtestResults)
    } catch {
      setError('Invalid JSON in backtest results')
      setSaving(false)
      return
    }

    const body = {
      name, description, price: parseFloat(price), assetType,
      indicatorsConfig: configParsed, backtestResults: backtestParsed, isPublished,
    }

    const url = isEdit ? `/api/marketplace/${initial!.id}` : '/api/marketplace'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      onSave()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-emerald-500/10 bg-[#0a0a0a] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">{isEdit ? 'Edit Listing' : 'Create New Listing'}</h3>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] text-zinc-500 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-emerald-500/30 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Price (USD)</label>
            <input type="number" step="0.01" min="0.99" value={price} onChange={(e) => setPrice(e.target.value)} required
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-emerald-500/30 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Asset Type</label>
            <select value={assetType} onChange={(e) => setAssetType(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2 text-xs text-zinc-400 focus:border-emerald-500/30 focus:outline-none">
              <option value="crypto">Crypto</option>
              <option value="forex">Forex</option>
              <option value="stocks">Stocks</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-zinc-500 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-emerald-500/30 focus:outline-none" />
      </div>

      <div>
        <label className="block text-[10px] text-zinc-500 mb-1">Indicators Config (JSON)</label>
        <textarea value={indicatorsConfig} onChange={(e) => setIndicatorsConfig(e.target.value)} rows={3}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] font-mono text-zinc-300 focus:border-emerald-500/30 focus:outline-none" />
      </div>

      <div>
        <label className="block text-[10px] text-zinc-500 mb-1">Backtest Results (JSON: winRate, profitFactor, totalTrades, maxDrawdown)</label>
        <textarea value={backtestResults} onChange={(e) => setBacktestResults(e.target.value)} rows={3}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] font-mono text-zinc-300 focus:border-emerald-500/30 focus:outline-none" />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-white/[0.06] bg-white/[0.03] text-emerald-500 focus:ring-emerald-500/30" />
          <span className="text-xs text-zinc-400">Published</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-xs text-zinc-400 hover:bg-white/[0.06] transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default function MyMarketplacePage() {
  const [tab, setTab] = useState<Tab>('listings')
  const [listings, setListings] = useState<MyListing[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null)
  const [revealedConfig, setRevealedConfig] = useState<Record<string, unknown> | null>(null)
  const [revealId, setRevealId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [listingsRes, purchasesRes, earningsRes] = await Promise.all([
      fetch('/api/marketplace?author=me'),
      fetch('/api/marketplace/purchases'),
      fetch('/api/marketplace/earnings'),
    ])

    if (listingsRes.ok) {
      const data = await listingsRes.json()
      setListings(data.listings ?? [])
    }
    if (purchasesRes.ok) {
      const data = await purchasesRes.json()
      setPurchases(data.purchases ?? [])
    }
    if (earningsRes.ok) {
      const data = await earningsRes.json()
      setEarnings(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    await fetch(`/api/marketplace/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function handleTogglePublish(id: string, current: boolean) {
    await fetch(`/api/marketplace/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    fetchAll()
  }

  async function handleEdit(id: string) {
    const res = await fetch(`/api/marketplace/${id}`)
    if (res.ok) {
      const data = await res.json()
      setEditData({
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        assetType: data.assetType,
        isPublished: data.isPublished,
        indicatorsConfig: JSON.stringify(data.indicatorsConfig ?? {}, null, 2),
        backtestResults: JSON.stringify(data.backtestResults ?? {}, null, 2),
      })
      setEditId(id)
      setShowForm(true)
    }
  }

  async function handleReveal(listingId: string) {
    const res = await fetch(`/api/marketplace/${listingId}`)
    if (res.ok) {
      const data = await res.json()
      setRevealedConfig(data.indicatorsConfig)
      setRevealId(listingId)
    }
  }

  const tabClass = (t: Tab) =>
    `rounded-full px-4 py-1.5 text-[11px] font-medium transition-colors ${
      tab === t
        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]'
    }`

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-white">My Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('listings')} className={tabClass('listings')}>
            <Package size={12} className="inline mr-1" /> My Listings
          </button>
          <button onClick={() => setTab('earnings')} className={tabClass('earnings')}>
            <CurrencyDollar size={12} className="inline mr-1" /> Earnings
          </button>
          <button onClick={() => setTab('purchases')} className={tabClass('purchases')}>
            <ShoppingCart size={12} className="inline mr-1" /> My Purchases
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-emerald-500/10 bg-[#0a0a0a] p-5 animate-pulse">
                <div className="h-4 w-40 rounded bg-white/[0.06] mb-3" />
                <div className="h-3 w-full rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Listings tab */}
            {tab === 'listings' && (
              <div className="space-y-4">
                {!showForm && (
                  <button
                    onClick={() => { setShowForm(true); setEditId(null); setEditData(null) }}
                    className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Plus size={14} /> Create New Listing
                  </button>
                )}

                {showForm && (
                  <ListingForm
                    initial={editData ? editData as Parameters<typeof ListingForm>[0]['initial'] : undefined}
                    onSave={() => { setShowForm(false); setEditId(null); setEditData(null); fetchAll() }}
                    onCancel={() => { setShowForm(false); setEditId(null); setEditData(null) }}
                  />
                )}

                {listings.length === 0 && !showForm ? (
                  <div className="text-center py-12">
                    <Package size={36} className="text-zinc-800 mx-auto mb-3" />
                    <p className="text-sm text-zinc-600">No listings yet. Create your first strategy!</p>
                  </div>
                ) : (
                  listings.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-xl border border-emerald-500/10 bg-[#0a0a0a] p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-white truncate">{l.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${l.isPublished ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border border-white/[0.06] bg-white/[0.03] text-zinc-600'}`}>
                            {l.isPublished ? 'LIVE' : 'DRAFT'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1">
                          ${l.price.toFixed(2)} &middot; {l.purchaseCount} purchase{l.purchaseCount !== 1 ? 's' : ''} &middot; {l.assetType}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => handleTogglePublish(l.id, l.isPublished)}
                          className="rounded-full p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors" title={l.isPublished ? 'Unpublish' : 'Publish'}>
                          {l.isPublished ? <EyeSlash size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => handleEdit(l.id)}
                          className="rounded-full p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors" title="Edit">
                          <PencilSimple size={14} />
                        </button>
                        <button onClick={() => handleDelete(l.id)}
                          className="rounded-full p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Delete">
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Earnings tab */}
            {tab === 'earnings' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                  <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider mb-1">Total Earnings (85%)</p>
                  <p className="text-3xl font-bold text-emerald-400">${(earnings?.total ?? 0).toFixed(2)}</p>
                </div>

                {earnings?.byListing.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-8">No earnings yet.</p>
                ) : (
                  <div className="space-y-2">
                    {earnings?.byListing.map((l) => (
                      <div key={l.listingId} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4">
                        <div>
                          <p className="text-sm text-white">{l.name}</p>
                          <p className="text-[10px] text-zinc-600">{l.count} sale{l.count !== 1 ? 's' : ''} &times; ${l.price.toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-semibold text-emerald-400">${l.earnings.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Purchases tab */}
            {tab === 'purchases' && (
              <div className="space-y-3">
                {purchases.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart size={36} className="text-zinc-800 mx-auto mb-3" />
                    <p className="text-sm text-zinc-600">No purchases yet.</p>
                    <Link href="/marketplace" className="text-xs text-emerald-400 hover:underline mt-2 inline-block">
                      Browse marketplace
                    </Link>
                  </div>
                ) : (
                  purchases.map((p) => (
                    <div key={p.id} className="rounded-xl border border-emerald-500/10 bg-[#0a0a0a] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-white">{p.listing.name}</h3>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(p.purchasedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mb-3">
                        by {p.listing.author.name || p.listing.author.email} &middot; ${p.listing.price.toFixed(2)}
                      </p>

                      {revealId === p.listing.id && revealedConfig ? (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <p className="text-[10px] font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Strategy Config</p>
                          <pre className="text-[11px] text-zinc-300 overflow-auto max-h-40 whitespace-pre-wrap">
                            {JSON.stringify(revealedConfig, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleReveal(p.listing.id)}
                          className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          Unlock Config
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
