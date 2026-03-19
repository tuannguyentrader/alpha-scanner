export default function Footer() {
  return (
    <footer className="border-t border-[#222] bg-[#111]">
      <div className="flex h-10 items-center justify-between px-4 sm:px-5">
        <p className="text-xs text-gray-600">
          <span className="text-[#3b82f6] mr-1" aria-hidden="true">⚡</span>
          Alpha Scanner &copy; 2026
          <span className="hidden sm:inline"> &bull; Multi-Asset Trading Scanner</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] shadow-[0_0_4px_#14b8a6]" aria-hidden="true" />
          <p className="text-xs text-gray-700">v0.2.0</p>
        </div>
      </div>
    </footer>
  )
}
