'use client'

import Link from 'next/link'

interface NavbarProps {
  onMenuToggle: () => void
  sidebarOpen?: boolean
}

export default function Navbar({ onMenuToggle, sidebarOpen = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#222] bg-[#111]">
      <div className="flex h-full items-center justify-between px-4 sm:px-5">
        {/* Logo + hamburger */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger — animated to X when open */}
          <button
            onClick={onMenuToggle}
            className="btn-icon flex items-center justify-center rounded-md p-2 text-gray-400 transition-all duration-200 hover:bg-[#1a1a1a] hover:text-white active:scale-95 md:hidden"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 text-white transition-opacity hover:opacity-80"
            aria-label="Alpha Scanner home"
          >
            <span className="text-xl leading-none text-[#3b82f6]" aria-hidden="true">⚡</span>
            <span className="font-bold tracking-tight text-sm sm:text-base">Alpha Scanner</span>
          </Link>
        </div>

        {/* Right nav */}
        <nav className="flex items-center gap-1" aria-label="Top navigation">
          <Link
            href="/backtest"
            className="hidden rounded-md px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-[#1a1a1a] hover:text-gray-300 sm:block"
          >
            Backtest
          </Link>
          <Link
            href="/leaderboard"
            className="hidden rounded-md px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-[#1a1a1a] hover:text-gray-300 sm:block"
          >
            Leaderboard
          </Link>

          <div className="mx-1 hidden h-4 w-px bg-[#333] sm:block" aria-hidden="true" />

          {/* Settings icon */}
          <button
            className="btn-icon flex items-center justify-center rounded-md p-2 text-gray-400 transition-colors hover:bg-[#1a1a1a] hover:text-white"
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* Live badge */}
          <div className="ml-1 flex items-center gap-1.5 rounded-full border border-[#222] bg-[#1a1a1a] px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#14b8a6] shadow-[0_0_4px_#14b8a6]" aria-hidden="true" />
            <span className="text-xs font-medium text-gray-400 leading-none">Live</span>
          </div>
        </nav>
      </div>
    </header>
  )
}
