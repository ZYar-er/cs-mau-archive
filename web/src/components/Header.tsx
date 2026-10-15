import type { MouseEvent as ReactMouseEvent } from 'react'
import { useI18n } from '../lib/i18n'

/**
 * The next style card, as the header's style control needs it. The host builds
 * it (see `styles/useStyleSelection.ts`) because only the host knows how its
 * own URL is shaped.
 */
export interface StyleSwitch {
  /**
   * Shown on the control. This is the style you get, not the one you are on —
   * the language control beside it names its target the same way, so the two
   * chips read alike.
   */
  title: string
  /** Where the control leads without JavaScript, and where ⌘-click opens. */
  href: string
  onSelect: () => void
}

/**
 * Everything the Header can be told to do. Both fields are optional: a caller
 * that passes neither gets the header's own behaviour — the language control
 * switches in place, and no style control is rendered. The site and the lab
 * both pass the pair; see `styles/useStyleSelection.ts`.
 */
export interface HeaderProps {
  /**
   * Takes over the language switch. Callers that own a style selection pass
   * their own handler so the switch carries the current style along instead of
   * dropping it; on its own the Header rewrites the localized path.
   */
  onLanguageToggle?: () => void
  /**
   * Adds the style control between the language and GitHub chips. Omitted by
   * any caller with no style system, which leaves the control out entirely.
   */
  styleSwitch?: StyleSwitch
}

export default function Header({ onLanguageToggle, styleSwitch }: HeaderProps) {
  const { t, lang, setLang } = useI18n()
  const nextLang = lang === 'en' ? 'zh' : 'en'
  const languageHref = nextLang === 'zh' ? '/zh/' : '/'
  const languageLabel = nextLang === 'zh' ? '中文' : 'EN'
  const languageAria = nextLang === 'zh' ? t('switchToZh') : t('switchToEn')
  // The min-width absorbs the difference between "中文" (a full-width pair —
  // ~43px at xs, ~47px at sm) and "EN" (~36px). Without it the control resizes
  // on every switch and shoves the GitHub link sideways.
  const languageClass =
    'site-header-action site-header-lang rounded-sm bg-steam-card px-2 py-2 text-center uppercase tracking-wider transition-colors hover:bg-steam-control/50 hover:text-steam-text min-w-12 sm:min-w-13'
  // The label drops below sm and only the glyph remains — the same trade the
  // GitHub chip beside it makes, for the same reason: three labelled chips
  // plus the site title do not fit at 375px, and the site title is the one
  // that would wrap to make room. Unlike the language chip there is no
  // min-width: the label is a card title, so its length is the registry's
  // business, and the chips to its right do shift when the style changes.
  // That is a deliberate click rather than a control flipped back and forth,
  // which is why the language chip can afford to pin its width and this one
  // cannot. Card titles keep their own casing — "Swiss" is the card's name.
  const styleClass =
    'site-header-action site-header-style flex items-center gap-1.5 rounded-sm bg-steam-card px-2 py-2 transition-colors hover:bg-steam-control/50 hover:text-steam-text'

  /**
   * Deliberately still an <a>. Without JavaScript it navigates to the other
   * localized document, which is the whole reason two of them are prerendered.
   * With JavaScript the click is taken over so the swap costs no reload — and
   * the URL is rewritten to match, so a reload or a shared link still lands on
   * the right one.
   */
  function handleLanguageClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    if (onLanguageToggle) {
      onLanguageToggle()
      return
    }
    setLang(nextLang)
    window.history.replaceState(null, '', languageHref)
  }

  /**
   * Same shape as the language control, and for the same reason: the href is
   * real, so ⌘-click or a middle click opens the other style in a new tab.
   * Without JavaScript that navigation lands on the same prerendered document
   * — only the default style is prerendered — which is the accepted cost of
   * shipping one document rather than one per style.
   */
  function handleStyleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    styleSwitch?.onSelect()
  }

  return (
    <header className="site-header bg-steam-nav pt-[env(safe-area-inset-top)] shadow-steam-lg">
      <div className="site-header-inner mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <svg viewBox="0 0 16 16" className="site-header-mark h-7 w-7" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="7" stroke="#66c0f4" strokeWidth="0.5" />
          <path d="M6 5l4.5 3L6 11V5z" fill="#66c0f4" />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="site-header-title text-sm font-semibold uppercase tracking-[0.12em] text-steam-text min-[420px]:text-base sm:text-lg">
            CS MAU Tracker
          </span>
          <span className="site-header-subtitle mt-0.5 hidden text-[10px] uppercase tracking-[0.25em] text-steam-muted min-[420px]:block sm:text-xs">
            {t('subtitle')}
          </span>
        </div>
        <div className="site-header-actions ml-auto flex items-center gap-2 text-xs text-steam-muted sm:gap-3 sm:text-sm">
          <a
            href={languageHref}
            onClick={handleLanguageClick}
            aria-label={languageAria}
            className={languageClass}
          >
            {languageLabel}
          </a>
          {styleSwitch && (
            <a
              href={styleSwitch.href}
              onClick={handleStyleClick}
              aria-label={t('switchStyleAria').replace(
                '{style}',
                styleSwitch.title,
              )}
              className={styleClass}
            >
              {/* Four tiles: the styles themselves, rather than the act of
                  cycling — a refresh arrow in a data page's header reads as
                  "reload the numbers". */}
              <svg
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="1" y="1" width="5.5" height="5.5" />
                <rect x="9.5" y="1" width="5.5" height="5.5" />
                <rect x="1" y="9.5" width="5.5" height="5.5" />
                <rect x="9.5" y="9.5" width="5.5" height="5.5" />
              </svg>
              <span className="site-header-action-label hidden sm:inline">
                {styleSwitch.title}
              </span>
            </a>
          )}
          <a
            href="https://github.com/ZYar-er/cs-mau-archive"
            target="_blank"
            rel="noreferrer"
            aria-label={t('githubAria')}
            className="site-header-action site-header-repo flex items-center gap-1.5 rounded-sm bg-steam-card px-2 py-2 transition-colors hover:bg-steam-control/50 hover:text-steam-text"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span className="site-header-action-label hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  )
}
