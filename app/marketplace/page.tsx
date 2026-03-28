'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Storefront, TrendUp, FunnelSimple, ShoppingCart, Users, MagnifyingGlass } from '@phosphor-icons/react'

interface ListingItem {
  id: string
  name: string
  description: string
  price: number
  assetType: string
  winRate: number | null
  totalTrades: number | null
  profitFactor: number | null
  author: { id: string; name: string | null }
  purchaseCount: number
  createdAt: string
}

type SortOption = 'newest' | 'winRate' | 'price' | 'popular'

function WinRateBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-[10px] text-zinc-600">N/A</span>
  const color = rate >= 60 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
    : rate >= 40 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
    : 'text-red-400 border-red-500/20 bg-red-500/10'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${color}`}>
      <TrendUp size={10} />
      {rate.toFixed(1)}%
    </span>
  )
}

function ListingCard({ listing }: { listing: ListingItem }) {
  return (
    <Link
      href={`/marketplace?detail=${listing.id}`}
      className="group flex flex-col rounded-xl border border-emerald-500/10 bg-[#0a0a0a] p-5 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/[0.02]"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
          {listing.name}
        </h3>
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
          ${listing.price.toFixed(2)}
        </span>
      </div>

      <p className="text-[11px] text-zinc-500 line-clamp-2 mb-4 min-h-[2.5rem]">
        {listing.description || 'No description provided.'}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <WinRateBadge rate={listing.winRate} />
        <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-500">
          {listing.assetType}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] pt-3">
        <span className="text-[10px] text-zinc-600">
          by {listing.author.name || 'Anonymous'}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-zinc-600">
          <Users size={10} />
          {listing.purchaseCount} trader{listing.purchaseCount !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-emerald-500/10 bg-[#0a0a0a] p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 w-32 rounded bg-white/[0.06]" />
        <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
      </div>
      <div className="h-3 w-full rounded bg-white/[0.04] mb-2" />
      <div className="h-3 w-2/3 rounded bg-white/[0.04] mb-4" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
        <div className="h-5 w-14 rounded-full bg-white/[0.04]" />
      </div>
      <div className="border-t border-white/[0.04] pt-3 flex justify-between">
        <div className="h-3 w-20 rounded bg-white/[0.04]" />
        <div className="h-3 w-16 rounded bg-white/[0.04]" />
      </div>
    </div>
  )
}

// Detail modal for a single listing
function ListingDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const [listing, setListing] = useState<{
    id: string; name: string; description: string; price: number; assetType: string
    backtestResults: Record<string, number>; indicatorsConfig: Record<string, unknown> | null
    author: { id: string; name: string | null }; purchaseCount: number; isOwner: boolean
    purchased: boolean; createdAt: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetch(`/api/marketplace/${id}`)
      .then((r) => r.json())
      .then(setListing)
      .finally(() => setLoading(false))
  }, [id])

  async function handlePurchase() {
    setPurchasing(true)
    const res = await fetch(`/api/marketplace/${id}/purchase`, { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="rounded-xl border border-emerald-500/10 bg-[#111] p-8 animate-pulse w-full max-w-lg">
          <div className="h-6 w-48 rounded bg-white/[0.06] mb-4" />
          <div className="h-4 w-full rounded bg-white/[0.04]" />
        </div>
      </div>
    )
  }

  if (!listing) return null

  const bt = listing.backtestResults

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-emerald-500/20 bg-[#0e0e0e] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{listing.name}</h2>
            <p className="text-[11px] text-zinc-500 mt-1">by {listing.author.name || 'Anonymous'}</p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-400">
            ${listing.price.toFixed(2)}
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-5">{listing.description || 'No description.'}</p>

        {/* Backtest stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            ['Win Rate', bt.winRate != null ? `${bt.winRate}%` : 'N/A'],
            ['Profit Factor', bt.profitFactor != null ? bt.profitFactor.toFixed(2) : 'N/A'],
            ['Total Trades', bt.totalTrades ?? 'N/A'],
            ['Max Drawdown', bt.maxDrawdown != null ? `${bt.maxDrawdown}%` : 'N/A'],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] text-zinc-600 mb-1">{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Config unlock */}
        {listing.indicatorsConfig ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mb-5">
            <p className="text-[10px] font-semibold text-emerald-400 mb-2 uppercase tracking-wider">
              {listing.isOwner ? 'Your Strategy Config' : 'Unlocked Config'}
            </p>
            <pre className="text-[11px] text-zinc-300 overflow-auto max-h-40 whitespace-pre-wrap">
              {JSON.stringify(listing.indicatorsConfig, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mb-5 text-center">
            <ShoppingCart size={20} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-500">Purchase to unlock the full strategy configuration</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-xs text-zinc-400 hover:bg-white/[0.06] transition-colors"
          >
            Close
          </button>
          {!listing.isOwner && !listing.purchased && (
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="flex-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {purchasing ? 'Redirecting...' : `Buy for $${listing.price.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortOption>('newest')
  const [assetType, setAssetType] = useState('all')
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  // Check URL for detail or purchased param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const detail = params.get('detail')
    const purchased = params.get('purchased')
    if (detail) setDetailId(detail)
    if (purchased) setDetailId(purchased)
  }, [])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ sort, assetType })
    const res = await fetch(`/api/marketplace?${params}`)
    const data = await res.json()
    setListings(data.listings ?? [])
    setLoading(false)
  }, [sort, assetType])

  useEffect(() => { fetchListings() }, [fetchListings])

  const filtered = search
    ? listings.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase())
      )
    : listings

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Storefront size={24} className="text-emerald-500" />
            <h1 className="text-2xl font-bold text-white">Signal Marketplace</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Browse and purchase proven trading strategies from the community.
          </p>
          <Link
            href="/marketplace/my"
            className="inline-flex items-center gap-1.5 mt-3 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            My Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Search strategies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-white/[0.06] bg-white/[0.03] py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500/30 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <FunnelSimple size={14} className="text-zinc-600" />
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="rounded-full border border-white/[0.06] bg-[#0a0a0a] px-3 py-2 text-[11px] text-zinc-400 focus:border-emerald-500/30 focus:outline-none"
            >
              <option value="all">All Assets</option>
              <option value="crypto">Crypto</option>
              <option value="forex">Forex</option>
              <option value="stocks">Stocks</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-full border border-white/[0.06] bg-[#0a0a0a] px-3 py-2 text-[11px] text-zinc-400 focus:border-emerald-500/30 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="winRate">Highest Win Rate</option>
              <option value="price">Lowest Price</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Storefront size={48} className="text-zinc-800 mb-4" />
            <p className="text-sm text-zinc-600">No strategies found.</p>
            <p className="text-xs text-zinc-700 mt-1">Be the first to publish one!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <div key={listing.id} onClick={() => setDetailId(listing.id)} className="cursor-pointer">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailId && (
        <ListingDetail id={detailId} onClose={() => {
          setDetailId(null)
          // Clean URL
          window.history.replaceState({}, '', '/marketplace')
        }} />
      )}
    </div>
  )
}
