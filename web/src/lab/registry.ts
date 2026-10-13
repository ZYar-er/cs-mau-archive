import type { StyleCard } from './types'
import baseline from './variants/baseline'
import swiss from './variants/swiss'

/**
 * Every style card in the lab, in switcher order.
 *
 * Adding one: create `variants/<slug>.tsx` — or `variants/<slug>/index.tsx`
 * once it needs more than one file — exporting a `StyleCard`, then list it
 * here. Nothing else changes: the lab is dev-only and outside `vite build`, so
 * no build config is involved and the production pages stay untouched.
 */
export const cards: StyleCard[] = [baseline, swiss]

export const DEFAULT_SLUG = cards[0].slug

/** Resolve a URL slug to a card, falling back to the first registered one. */
export function findCard(slug: string | null): StyleCard {
  return cards.find((card) => card.slug === slug) ?? cards[0]
}
