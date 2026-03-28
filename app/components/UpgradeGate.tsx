'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { Lock } from '@phosphor-icons/react'
import { usePlan } from '../hooks/usePlan'

type Plan = 'pro' | 'elite'

interface UpgradeGateProps {
  requiredPlan: Plan
  featureName: string
  children: ReactNode
}

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, elite: 2 }

const PLAN_LABEL: Record<Plan, string> = {
  pro: 'Pro',
  elite: 'Elite',
}

export default function UpgradeGate({ requiredPlan, featureName, children }: UpgradeGateProps) {
  const { plan, isLoading } = usePlan()

  const userRank = PLAN_RANK[plan] ?? 0
  const requiredRank = PLAN_RANK[requiredPlan] ?? 1

  if (isLoading || userRank >= requiredRank) {
    return <>{children}</>
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred children behind overlay */}
      <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden="true">
        {children}
      </div>

      {/* Glass overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] px-8 py-6 text-center shadow-2xl max-w-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Lock size={20} weight="bold" className="text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-zinc-200">{featureName}</p>
          <p className="text-xs text-zinc-500">
            This feature requires the{' '}
            <span className="font-semibold text-emerald-400">{PLAN_LABEL[requiredPlan]}</span>{' '}
            plan
          </p>
          <Link
            href="/pricing"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Upgrade to {PLAN_LABEL[requiredPlan]}
          </Link>
        </div>
      </div>
    </div>
  )
}
