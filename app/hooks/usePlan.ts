'use client'

import { useState, useEffect } from 'react'

interface PlanData {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
}

export function usePlan() {
  const [data, setData] = useState<PlanData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/billing/status')
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((d) => {
        if (d) setData(d)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return {
    plan: data?.plan ?? 'free',
    status: data?.status ?? 'active',
    currentPeriodEnd: data?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
    stripeCustomerId: data?.stripeCustomerId ?? null,
    isLoading,
    isPro: data?.plan === 'pro' || data?.plan === 'elite',
    isElite: data?.plan === 'elite',
  }
}
