export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <span className="text-5xl leading-none text-[#3b82f6]">⚡</span>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Alpha Scanner
          </h1>
        </div>

        {/* Subtitle */}
        <p className="max-w-md text-lg text-gray-400">
          Multi-Asset Trading Opportunity Scanner
        </p>

        {/* Accent divider */}
        <div className="flex items-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#3b82f6]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Powered by AI
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#14b8a6]" />
        </div>

        {/* Asset badges */}
        <div className="flex flex-wrap justify-center gap-2">
          {['XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD', 'XRPUSD'].map((asset) => (
            <span
              key={asset}
              className="rounded-full border border-[#222222] bg-[#111111] px-3 py-1 text-xs font-mono text-gray-400"
            >
              {asset}
            </span>
          ))}
        </div>

        {/* Mode badges */}
        <div className="flex gap-3">
          {[
            { label: 'Swing', color: '#3b82f6' },
            { label: 'Intraday', color: '#14b8a6' },
            { label: 'Scalper', color: '#a855f7' },
          ].map(({ label, color }) => (
            <span
              key={label}
              className="rounded-md border px-3 py-1 text-xs font-semibold"
              style={{ borderColor: color, color }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Status */}
        <div className="mt-4 rounded-lg border border-[#222222] bg-[#111111] px-6 py-3">
          <p className="text-sm text-gray-500">
            Dashboard launching soon&nbsp;&mdash;&nbsp;
            <span className="text-[#3b82f6]">Phase 1 scaffold complete</span>
          </p>
        </div>
      </div>
    </main>
  )
}
