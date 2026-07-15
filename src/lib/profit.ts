import type { MockQuery } from '../types/query'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

/** Fork bond in REP (~2% of supply). Escalation bonds cap here and trigger a fork. */
export const FORK_BOND_REP = 5_240_000

/**
 * Reporter pay at a given timestamp: ramps linearly from 0% of the query fee
 * at creation to 100% three days later, capped at the fee.
 */
export function reporterPayAt(query: MockQuery, timestamp: number): number {
  const elapsed = timestamp - query.createdAt
  const pay = (query.fee * elapsed) / THREE_DAYS_MS
  return Math.min(query.fee, Math.max(0, pay))
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
  /** Bet returned plus proportional share of 80% of losing stakes. */
  bond: number
  tip: number
  reporterPay: number
  total: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Escalation payout for a prospective stake, in REP.
 * Winners get their bond back plus 80% of losing stakes split proportionally
 * (20% of losing stakes are burned). The reporter pay and tip go only to the
 * first correct reporter, so they are included only when no one has staked on
 * the selected outcome yet.
 */
export function toWinBreakdown(
  bet: number,
  query: MockQuery,
  outcomeIndex: number,
): ToWinBreakdown {
  if (bet <= 0) return { bond: 0, tip: 0, reporterPay: 0, total: 0 }
  const total = query.totalStakedByOutcome.reduce((a, b) => a + b, 0)
  const onOutcome = query.totalStakedByOutcome[outcomeIndex] ?? 0
  const losing = total - onOutcome
  const share = (bet / (onOutcome + bet)) * 0.8 * losing
  const firstOnOutcome = !query.stakes.some(
    (s) => s.outcomeIndex === outcomeIndex,
  )
  const bond = round2(bet + share)
  const tip = round2(firstOnOutcome ? (query.tip ?? 0) : 0)
  const reporterPay = round2(
    firstOnOutcome ? reporterPayAt(query, Date.now()) : 0,
  )
  return { bond, tip, reporterPay, total: round2(bond + tip + reporterPay) }
}

export function estimateToWin(
  bet: number,
  query: MockQuery,
  outcomeIndex: number,
): number {
  return toWinBreakdown(bet, query, outcomeIndex).total
}
