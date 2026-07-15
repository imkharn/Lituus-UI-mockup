import type { MockQuery } from '../types/query'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

/** Fork bond in REP (~2% of supply). Escalation bonds cap here and trigger a fork. */
export const FORK_BOND_REP = 5_240_000

/** Current protocol fee in REP ($42 / $10). Assumed unchanged across mock queries. */
export const PROTOCOL_FEE_REP = 4.2

/**
 * Reporter pay at a given timestamp: ramps linearly from 0% of the protocol fee
 * at creation to 100% three days later, capped at the fee.
 */
export function reporterPayAt(query: MockQuery, timestamp: number): number {
  const fee = PROTOCOL_FEE_REP
  const elapsed = timestamp - query.createdAt
  const pay = (fee * elapsed) / THREE_DAYS_MS
  return Math.min(fee, Math.max(0, pay))
}

/**
 * The reporter pay currently on the table. If the query has been reported,
 * pay is locked at the time of the first stake; otherwise it accrues to now.
 */
export function currentReporterPay(query: MockQuery): number {
  const t =
    query.stakes.length > 0
      ? Math.min(...query.stakes.map((s) => s.timestamp))
      : Date.now()
  return reporterPayAt(query, t)
}

/**
 * Estimated profit for smart sorting.
 * - No reports yet: current reporter pay plus any tip (both go to the first correct reporter).
 * - Reported (appealing): assume a 1% chance the previous report was wrong,
 *   i.e. 0.4% of the total staked on the tentative winning outcome.
 */
export function estimatedProfit(query: MockQuery): number {
  if (query.stakes.length === 0) {
    return currentReporterPay(query) + (query.tip ?? 0)
  }
  const tentative =
    query.tentativeOutcome === null
      ? 0
      : (query.totalStakedByOutcome[query.tentativeOutcome] ?? 0)
  return 0.004 * tentative
}

/** Smart sort score: estimated profit / (minutes remaining + 5). */
export function smartSortScore(query: MockQuery): number {
  const minutesRemaining = query.timeRemainingMs / 60_000
  return estimatedProfit(query) / (minutesRemaining + 5)
}

export interface ToWinBreakdown {
  /** Current bet plus any prior user stakes on this outcome. */
  bond: number
  /** User's proportional share of 80% of stakes on other outcomes. */
  losingShare: number
  tip: number
  reporterPay: number
  total: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Escalation payout for a prospective stake, in REP.
 * Winners get their bond back plus 80% of losing stakes split proportionally
 * (20% of losing stakes are burned).
 *
 * The UI assumes the customer is always right: tip and reporter pay go to the
 * first correct reporter, so they are included whenever this stake would be
 * the first on the selected outcome. Tip is 0 when the query has no tip.
 * Reporter pay is locked at the time of the first report on the query (linear
 * over the 3-day first-report window); before any report it accrues to now.
 * Both are 0 when staking on an outcome that already has stake.
 */
export function toWinBreakdown(
  bet: number,
  query: MockQuery,
  outcomeIndex: number,
): ToWinBreakdown {
  if (bet <= 0) return { bond: 0, losingShare: 0, tip: 0, reporterPay: 0, total: 0 }

  const userPrev = query.stakes
    .filter((s) => s.isUser && s.outcomeIndex === outcomeIndex)
    .reduce((a, s) => a + s.amount, 0)
  const bond = round2(bet + userPrev)

  const total = query.totalStakedByOutcome.reduce((a, b) => a + b, 0)
  const onOutcome = query.totalStakedByOutcome[outcomeIndex] ?? 0
  const losing = total - onOutcome
  const onOutcomeAfter = onOutcome + bet
  const losingShare = round2(
    onOutcomeAfter > 0 ? ((userPrev + bet) / onOutcomeAfter) * 0.8 * losing : 0,
  )

  const firstOnOutcome = !query.stakes.some(
    (s) => s.outcomeIndex === outcomeIndex,
  )
  const tip = round2(firstOnOutcome ? (query.tip ?? 0) : 0)
  const reporterPay = round2(firstOnOutcome ? currentReporterPay(query) : 0)

  return {
    bond,
    losingShare,
    tip,
    reporterPay,
    total: round2(bond + losingShare + tip + reporterPay),
  }
}

export function estimateToWin(
  bet: number,
  query: MockQuery,
  outcomeIndex: number,
): number {
  return toWinBreakdown(bet, query, outcomeIndex).total
}

/**
 * Max available profit if the user places the full bond on the best selectable
 * outcome: max(toWin − maxBet). Assumes unlimited REP (wallet balance does not
 * cap the max bet). Returns null when profit is not applicable (resolved /
 * migrate / hidden).
 */
export function availableProfit(query: MockQuery): number | null {
  if (query.isResolved || query.forkInfo || query.hidden) return null
  const maxBet = query.appealBond || query.fee || PROTOCOL_FEE_REP
  if (maxBet <= 0) return 0

  const locked =
    query.stakes.length > 0 ? query.tentativeOutcome : null

  let best = 0
  for (let i = 0; i < query.outcomes.length; i++) {
    if (locked !== null && i === locked) continue
    const profit = estimateToWin(maxBet, query, i) - maxBet
    if (profit > best) best = profit
  }
  return round2(best)
}
