import type { ComponentType } from 'react'
import type { StyleSwitch } from '../components/Header'

/**
 * What the host hands every card. A card receives no data — it reads the
 * canonical records itself — but it does need to drive the chrome that sits
 * above it, which is why both header controls come from here.
 *
 * Both must be forwarded to `components/Header.tsx`. Dropping `styleSwitch`
 * removes the control from the header; dropping `onLanguageToggle` makes the
 * header fall back to its own behaviour, which rewrites the localized path and
 * navigates the preview out from under the card.
 */
export interface StyleCardProps {
  /** Switch the displayed language without leaving the page. */
  onLanguageToggle: () => void
  /** The next card in the registry, as the header's style control needs it. */
  styleSwitch: StyleSwitch
}

/**
 * One style card: a visual language applied to the canonical CS MAU dataset.
 *
 * A card is a whole page. Everything aesthetic is its own business; the hard
 * rules every card must satisfy regardless of style live in `docs/lab.md`.
 */
export interface StyleCard {
  /** Stable id, used as `?v=<slug>`. Lowercase kebab; never reused. */
  slug: string
  /**
   * Shown in the lab's switcher and on the site header's style control, so it
   * has to stay short enough for a chip.
   */
  title: string
  /** One line on what this card explores, shown under the lab switcher. */
  note: string
  /**
   * The card's page root. It owns its own landmarks (<header>/<main>/<footer>)
   * and reads the canonical data itself.
   */
  Component: ComponentType<StyleCardProps>
}
