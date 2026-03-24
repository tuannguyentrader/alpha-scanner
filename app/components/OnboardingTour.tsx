'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CaretRight, SkipForward } from '@phosphor-icons/react'

const TOUR_STEPS = [
  {
    id: 'signal',
    title: 'View Signal',
    description:
      'The signal panel shows real-time BUY/SELL/NEUTRAL signals with a confidence score and technical indicator breakdown for your selected symbol.',
    selector: '[data-tour-step="signal"]',
  },
  {
    id: 'risk',
    title: 'Set Risk Profile',
    description:
      'Choose Conservative, Balanced, or High-Risk to adjust signal thresholds and position sizing recommendations to match your trading style.',
    selector: '[data-tour-step="risk"]',
  },
  {
    id: 'broker',
    title: 'Connect Broker',
    description:
      'Link your MetaAPI broker account to execute trades directly from signals. Paper trading is available without a connection.',
    selector: '[data-tour-step="broker"]',
  },
  {
    id: 'alerts',
    title: 'Enable Alerts',
    description:
      'Configure Telegram notifications to receive instant alerts the moment a strong signal fires — no need to watch the screen.',
    selector: '[data-tour-step="alerts"]',
  },
  {
    id: 'share',
    title: 'Share Signal',
    description:
      'Share your current symbol, mode, and risk setup with others via a unique URL. Great for sharing your strategy with your trading community.',
    selector: '[data-tour-step="share"]',
  },
] as const

const STORAGE_KEY = 'onboarding_completed'
const TOOLTIP_WIDTH = 300
const PADDING = 10

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

declare global {
  interface Window {
    startOnboardingTour?: () => void
  }
}

interface OnboardingTourProps {
  autoShow?: boolean
}

export default function OnboardingTour({ autoShow = true }: OnboardingTourProps) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)

  // Auto-show once on first visit
  useEffect(() => {
    if (!autoShow) return
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      const t = setTimeout(() => setActive(true), 900)
      return () => clearTimeout(t)
    }
  }, [autoShow])

  const computeRect = useCallback((index: number) => {
    const step = TOUR_STEPS[index]
    const el = document.querySelector(step.selector)
    if (!el) {
      setTargetRect(null)
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Wait for scroll animation
    setTimeout(() => {
      const r = el.getBoundingClientRect()
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }, 350)
  }, [])

  useEffect(() => {
    if (active) computeRect(stepIndex)
  }, [active, stepIndex, computeRect])

  // Re-compute on scroll / resize
  useEffect(() => {
    if (!active) return
    const refresh = () => computeRect(stepIndex)
    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, { passive: true })
    return () => {
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh)
    }
  }, [active, stepIndex, computeRect])

  // Expose globally for "Restart Tour"
  useEffect(() => {
    window.startOnboardingTour = () => {
      setStepIndex(0)
      setActive(true)
    }
    return () => {
      delete window.startOnboardingTour
    }
  }, [])

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setActive(false)
    setStepIndex(0)
    setTargetRect(null)
  }, [])

  const next = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      complete()
    }
  }

  if (!active) return null

  const step = TOUR_STEPS[stepIndex]

  // Tooltip position
  let tooltipTop = 0
  let tooltipLeft = 0

  if (targetRect) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const highlightBottom = targetRect.top + targetRect.height

    if (highlightBottom + 200 < vh) {
      tooltipTop = highlightBottom + PADDING + 10
    } else {
      tooltipTop = Math.max(8, targetRect.top - 200 - PADDING)
    }

    tooltipLeft = Math.max(
      12,
      Math.min(
        targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2,
        vw - TOOLTIP_WIDTH - 12,
      ),
    )
  } else {
    tooltipTop = (typeof window !== 'undefined' ? window.innerHeight : 600) / 2 - 90
    tooltipLeft =
      (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - TOOLTIP_WIDTH / 2
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998]" aria-modal="true" role="dialog" aria-label="Onboarding tour">
      {/* SVG overlay with spotlight cutout */}
      {targetRect ? (
        <svg
          className="pointer-events-auto fixed inset-0 h-full w-full"
          onClick={complete}
          aria-hidden="true"
        >
          <defs>
            <mask id="tour-spotlight">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - PADDING}
                y={targetRect.top - PADDING}
                width={targetRect.width + PADDING * 2}
                height={targetRect.height + PADDING * 2}
                rx={10}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.76)"
            mask="url(#tour-spotlight)"
          />
        </svg>
      ) : (
        <div
          className="pointer-events-auto fixed inset-0 bg-black/76"
          onClick={complete}
          aria-hidden="true"
        />
      )}

      {/* Emerald highlight ring around target */}
      {targetRect && (
        <div
          className="pointer-events-none fixed rounded-xl"
          style={{
            top: targetRect.top - PADDING,
            left: targetRect.left - PADDING,
            width: targetRect.width + PADDING * 2,
            height: targetRect.height + PADDING * 2,
            boxShadow: '0 0 0 2px #10b981, 0 0 24px rgba(16,185,129,0.35)',
            zIndex: 9999,
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto fixed z-[10000]"
          style={{ top: tooltipTop, left: tooltipLeft, width: TOOLTIP_WIDTH }}
        >
          <div className="glass-panel-strong rounded-xl border border-emerald-500/25 p-4 shadow-2xl">
            {/* Header */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                  Step {stepIndex + 1} of {TOUR_STEPS.length}
                </div>
                <h3 className="text-sm font-semibold text-white">{step.title}</h3>
              </div>
              <button
                onClick={complete}
                className="flex-shrink-0 p-0.5 text-zinc-600 transition-colors hover:text-zinc-300"
                aria-label="Close tour"
              >
                <X size={14} />
              </button>
            </div>

            {/* Progress dots */}
            <div className="mb-3 flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === stepIndex
                      ? 'w-4 bg-emerald-500'
                      : i < stepIndex
                        ? 'w-2 bg-emerald-500/40'
                        : 'w-2 bg-white/10'
                  }`}
                />
              ))}
            </div>

            <p className="mb-4 text-[11px] leading-relaxed text-zinc-400">
              {step.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={complete}
                className="flex items-center gap-1 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
              >
                <SkipForward size={12} aria-hidden="true" />
                Skip tour
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-[11px] font-semibold text-black transition-all hover:bg-emerald-400 active:scale-95"
              >
                {stepIndex < TOUR_STEPS.length - 1 ? (
                  <>
                    Next
                    <CaretRight size={12} aria-hidden="true" />
                  </>
                ) : (
                  'Done'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
