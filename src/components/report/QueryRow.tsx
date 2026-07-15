import clsx from 'clsx'
import type { MockQuery } from '../../types/query'
import {
  formatRep,
  formatTimeRemaining,
} from '../../lib/actions'
import { availableProfit } from '../../lib/profit'
import { QueryExpanded } from './QueryExpanded'

interface QueryRowProps {
  query: MockQuery
  expanded: boolean
  onToggle: () => void
  walletBalance: number
  onStake: (outcomeIndex: number, amount: number) => void
  onClaim: () => void
  onMigrate: (childLabel: string, amount: number) => void
  badge?: string
}

export function QueryRow({
  query,
  expanded,
  onToggle,
  walletBalance,
  onStake,
  onClaim,
  onMigrate,
  badge,
}: QueryRowProps) {
  const outcomeLabel =
    query.columnMode === 'preAppeal'
      ? query.outcomes[query.tentativeOutcome ?? query.finalOutcome ?? 0]
      : query.tentativeOutcome === null
        ? '—'
        : query.outcomes[query.tentativeOutcome]

  const bondLabel = query.isResolved
    ? '–'
    : `${formatRep(query.appealBond || query.fee)} REP`

  const bondHeader = query.isResolved
    ? 'Bond'
    : query.stakes.length === 0
      ? 'Reporting bond'
      : 'Appeal bond'

  const outcomeHeader = query.isResolved
    ? 'Final Outcome'
    : query.columnMode === 'preAppeal'
      ? 'Resolves to'
      : 'Tentative outcome'

  const timeLabel = query.isResolved
    ? '–'
    : formatTimeRemaining(query.timeRemainingMs)

  const profit = availableProfit(query, walletBalance)
  const profitLabel =
    profit == null ? '–' : `${formatRep(profit)} REP`

  return (
    <div
      className={clsx(
        'border-b border-border transition-colors',
        expanded ? 'bg-white' : 'bg-white hover:bg-row-hover',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[auto_1fr] items-center gap-3 px-4 py-2 text-left sm:px-6 lg:grid-cols-[auto_minmax(0,2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]"
      >
        <span
          className={clsx(
            'text-gray-400 transition-transform',
            expanded && 'rotate-90',
          )}
        >
          ▶
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {query.question.replace(/\s*\[[^\]]+\]\s*$/, '')}
            </p>
            {badge && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">
                {badge}
              </span>
            )}
            {query.isResolved && query.claimableAmount > 0 && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
                Claim {formatRep(query.claimableAmount)}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500 lg:hidden">
            <span>
              {outcomeHeader}: {outcomeLabel}
            </span>
            <span>
              {bondHeader}: {bondLabel}
            </span>
            <span>Available profit: {profitLabel}</span>
            <span>{timeLabel}</span>
          </div>
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="text-xs text-gray-500">{outcomeHeader}</p>
          <p className="truncate text-sm text-gray-900">{outcomeLabel}</p>
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="text-xs text-gray-500">{bondHeader}</p>
          <p className="text-sm text-gray-900">{bondLabel}</p>
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="text-sm text-gray-900">{profitLabel}</p>
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="text-xs text-gray-500">Time remaining</p>
          <p
            className={clsx(
              'text-sm font-medium',
              !query.isResolved && query.timeRemainingMs < 30 * 60_000
                ? 'text-red-600'
                : 'text-gray-900',
            )}
          >
            {timeLabel}
          </p>
        </div>
      </button>

      {expanded && (
        <QueryExpanded
          query={query}
          walletBalance={walletBalance}
          onStake={onStake}
          onClaim={onClaim}
          onMigrate={onMigrate}
        />
      )}
    </div>
  )
}
