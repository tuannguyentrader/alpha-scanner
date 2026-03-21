'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ChevronUp, ChevronDown, X } from 'lucide-react'

const ITEMS = [
  { id: 'signal', label: 'View a Signal', hint: 'Check the signal panel' },
  { id: 'risk', label: 'Set Risk Profile', hint: 'Choose Conservative, Balanced, or High-Risk' },
  { id: 'broker', label: 'Connect Broker', hint: 'Link your MetaAPI account' },
  { id: 'alerts', label: 'Enable Alerts', hint: 'Configure Telegram notifications' },
  { id: 'share', label: 'Share a Signal', hint: 'Share your first signal setup' },
] as const

const STORAGE_CHECKLIST = 'onboarding_checklist'
const STORAGE_DISMISSED = 'onboarding_checklist_dismissed'
const STORAGE_COMPLETED = 'onboarding_completed'

export default function OnboardingChecklist() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(true) // start hidden; hydrate from localStorage

  useEffect(() => {
    if (localStorage.getItem(STORAGE_DISMISSED)) return
    try {
      const saved = localStorage.getItem(STORAGE_CHECKLIST)
      if (saved) setCompleted(new Set(JSON.parse(saved) as string[]))
    } catch {
      // ignore
    }
    setDismissed(false)
  }, [])

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem(STORAGE_CHECKLIST, JSON.stringify([...next]))
      if (next.size === ITEMS.length) {
        localStorage.setItem(STORAGE_COMPLETED, 'true')
      }
      return next
    })
  }

  const dismiss = () => {
    localStorage.setItem(STORAGE_DISMISSED, 'true')
    setDismissed(true)
  }

  const restartTour = () => {
    window.startOnboardingTour?.()
  }

  if (dismissed) return null

  const done = completed.size
  const total = ITEMS.length
  const pct = (done / total) * 100

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="glass-panel-strong overflow-hidden rounded-xl border border-white/[0.06] shadow-2xl"
      >
        {/* Header */}
        <button
          className="flex w-full items-center justify-between px-3 py-2.5 text-left select-none"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-controls="onboarding-list"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-emerald-500"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-white">Getting Started</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-emerald-400">
              {done}/{total}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                dismiss()
              }}
              className="p-0.5 text-zinc-600 transition-colors hover:text-zinc-300"
              aria-label="Dismiss checklist"
            >
              <X size={12} />
            </button>
            {collapsed ? (
              <ChevronUp size={12} className="text-zinc-500" aria-hidden="true" />
            ) : (
              <ChevronDown size={12} className="text-zinc-500" aria-hidden="true" />
            )}
          </div>
        </button>

        {/* Progress bar */}
        <div className="mx-3 h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>

        {/* List */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              id="onboarding-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-0.5 p-2">
                {ITEMS.map((item) => {
                  const isDone = completed.has(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      {isDone ? (
                        <CheckCircle2
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-emerald-500"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-zinc-600"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <div
                          className={`text-[11px] font-medium leading-tight ${
                            isDone ? 'text-zinc-600 line-through' : 'text-zinc-300'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-[10px] leading-tight text-zinc-600">
                          {item.hint}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-white/[0.04] px-3 py-2">
                <button
                  onClick={restartTour}
                  className="text-[10px] text-emerald-500 transition-colors hover:text-emerald-400"
                >
                  Restart guided tour →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
