'use client'

import { Sparkle, ChatTeardrop } from '@phosphor-icons/react'

interface Props {
  text: string
  isAI: boolean
  loading?: boolean
}

export default function SignalCommentary({ text, isAI, loading }: Props) {
  if (loading) {
    return (
      <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Sparkle size={12} className="animate-pulse text-emerald-500" />
          <span>Generating analysis...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          {isAI ? (
            <Sparkle size={12} className="text-emerald-500" />
          ) : (
            <ChatTeardrop size={12} className="text-zinc-500" />
          )}
        </div>
        <div>
          <p className="text-sm leading-relaxed text-zinc-300">{text}</p>
          <p className="mt-1.5 text-[10px] text-zinc-600">
            {isAI ? '✨ AI-generated analysis' : '📊 Rule-based analysis'}
          </p>
        </div>
      </div>
    </div>
  )
}
