export default function Header() {
  return (
    <header className="bg-steam-nav shadow-steam-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <svg viewBox="0 0 16 16" className="h-7 w-7" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="7" stroke="#66c0f4" strokeWidth="0.5" />
          <path d="M6 5l4.5 3L6 11V5z" fill="#66c0f4" />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-steam-text min-[420px]:text-base">
            CS MAU Tracker
          </span>
          <span className="mt-0.5 hidden text-[10px] uppercase tracking-[0.25em] text-steam-muted min-[420px]:block">
            Counter-Strike Monthly Active Users
          </span>
        </div>
        <div className="ml-auto hidden items-center gap-3 text-xs text-steam-muted sm:flex">
          <span className="rounded-sm bg-steam-card px-2 py-1 uppercase tracking-wider">
            Steam Web API
          </span>
        </div>
      </div>
    </header>
  )
}
