export default function Footer() {
  return (
    <footer className="mt-4 border-t border-steam-border/50 bg-steam-nav">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-steam-muted sm:flex-row sm:px-6">
        <span className="text-center">
          Data via Steam Web API &amp; Wayback Machine · Updated monthly
        </span>
        <span>CS MAU Tracker &copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
