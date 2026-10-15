import App from '../../App'
import type { StyleCard } from '../types'

/**
 * Reference card: the shipping page, re-exported unchanged.
 *
 * It exists so a new card is always judged as a diff against what is already
 * live — put baseline and the card side by side and the differences are
 * exactly the card's contribution. It is deliberately a re-export rather than
 * a reimplementation, so it cannot drift from the real page.
 */
const baseline: StyleCard = {
  slug: 'baseline',
  title: 'Baseline',
  note: '线上现状，未做任何改动 —— 其它风格卡的对照基准。',
  Component: App,
}

export default baseline
