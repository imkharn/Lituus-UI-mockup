import type { MockQuery, SortedSection, SortMode } from '../types/query'
import { smartSortScore } from './profit'

function isRequired(q: MockQuery): boolean {
  return (
    q.category === 'required_appeal_urgent' ||
    q.category === 'required_fork_migrate' ||
    (q.userHasLosingBond && q.hasOpenAppeal && q.timeRemainingMs < 30 * 60_000) ||
    Boolean(q.forkInfo && (q.forkInfo.forkState === 1 || q.forkInfo.forkState === 2))
  )
}

function isClaimable(q: MockQuery): boolean {
  return q.isResolved && q.claimableAmount > 0
}

function requiredRank(q: MockQuery): number {
  if (q.category === 'required_appeal_urgent' || q.userHasLosingBond) return 0
  return 1
}

/**
 * Sort reporter list into tiers:
 * 1. Required actions (urgent appeal, then fork migrate)
 * 2. Claimable winnings
 * 3. All remaining queries in one continuous list (smart or expire sort)
 *
 * Queries with timeRemainingMs <= 0 are filtered out.
 */
export function sortQueries(
  queries: MockQuery[],
  mode: SortMode,
): SortedSection[] {
  const visible = queries.filter((q) => q.timeRemainingMs > 0 && !q.hidden)

  const required = visible
    .filter(isRequired)
    .sort(
      (a, b) =>
        requiredRank(a) - requiredRank(b) ||
        a.timeRemainingMs - b.timeRemainingMs,
    )

  const claim = visible
    .filter((q) => !isRequired(q) && isClaimable(q))
    .sort((a, b) => b.claimableAmount - a.claimableAmount)

  const used = new Set([...required, ...claim].map((q) => q.id))
  const remaining = visible.filter((q) => !used.has(q.id))

  const activeSorted =
    mode === 'smart'
      ? [...remaining].sort((a, b) => smartSortScore(b) - smartSortScore(a))
      : [...remaining].sort((a, b) => a.timeRemainingMs - b.timeRemainingMs)

  const sections: SortedSection[] = []

  if (required.length) {
    sections.push({ tier: 'required', label: 'Required actions', queries: required })
  }
  if (claim.length) {
    sections.push({ tier: 'claim', label: 'Claim winnings', queries: claim })
  }
  if (activeSorted.length) {
    sections.push({
      tier: 'active',
      label: mode === 'smart' ? 'Suggested for you' : 'Next to expire',
      queries: activeSorted,
    })
  }

  return sections
}

export const SORT_STORAGE_KEY = 'lituus-report-sort'

export function loadSortMode(): SortMode {
  try {
    const v = localStorage.getItem(SORT_STORAGE_KEY)
    if (v === 'expire' || v === 'smart') return v
  } catch {
    /* ignore */
  }
  return 'smart'
}

export function saveSortMode(mode: SortMode): void {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}
