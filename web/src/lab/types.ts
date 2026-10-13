import type { ComponentType } from 'react'
import type { Lang } from '../lib/i18n'

/**
 * What the lab hands every card. A card receives no data — it reads the
 * canonical records itself — but it does need to be able to drive the lab's
 * own chrome, which is why the language toggle comes from here.
 */
export interface StyleCardProps {
  /** Switch the previewed language without leaving the lab. */
  onLanguageToggle: () => void
}

/**
 * One style card: a visual language applied to the canonical CS MAU dataset.
 *
 * Everything aesthetic is the card's own business. The hard rules every card
 * must satisfy regardless of style live in `docs/lab.md`.
 */
export interface StyleCard {
  /** Stable id, used as `?v=<slug>`. Lowercase kebab; never reused. */
  slug: string
  /** Shown in the switcher. */
  title: string
  /** One line on what this card explores, shown under the switcher. */
  note: string
  /**
   * The card's page root. It owns its own landmarks (<header>/<main>/<footer>)
   * and reads the canonical data itself.
   */
  Component: ComponentType<StyleCardProps>
}

/** Lab state, mirrored into the URL so any card view is linkable. */
export interface LabQuery {
  /** Card slug. */
  v: string
  lang: Lang
}
