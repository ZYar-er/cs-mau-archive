import type { StyleCard } from './types'
import baseline from './variants/baseline'
import swiss from './variants/swiss'

/**
 * Every style card, in switcher order.
 *
 * This registry is shipped: the site header's style control walks it, and the
 * cards are part of the production bundle. The lab's floating switcher walks
 * the same list in development.
 *
 * Adding one: create `variants/<slug>.tsx` — or `variants/<slug>/index.tsx`
 * once it needs more than one file — exporting a `StyleCard`, then list it
 * here. Nothing else changes, and no build config is involved.
 */
export const cards: StyleCard[] = [baseline, swiss]

export const DEFAULT_SLUG = cards[0].slug

/** Resolve a URL slug to a card, falling back to the first registered one. */
export function findCard(slug: string | null): StyleCard {
  return cards.find((card) => card.slug === slug) ?? cards[0]
}

/**
 * The card after this one, wrapping around. An unknown slug resolves to the
 * first card, so a stale link still lands somewhere real.
 */
export function nextCard(slug: string): StyleCard {
  const index = cards.findIndex((card) => card.slug === slug)
  return cards[(index + 1) % cards.length]
}
