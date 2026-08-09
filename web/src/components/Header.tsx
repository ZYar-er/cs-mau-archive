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
        <div className="ml-auto flex items-center gap-2 text-xs text-steam-muted sm:gap-3">
          <a
            href="https://github.com/ZYar-er/cs-mau-archive"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="flex items-center gap-1.5 rounded-sm bg-steam-card px-2 py-2 transition-colors hover:bg-steam-control/50 hover:text-steam-text"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  )
}
