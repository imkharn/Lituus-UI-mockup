import type { MockQuery } from '../../types/query'
import { formatRep, relativeTime, truncateAddress } from '../../lib/actions'

interface StakeTimelineProps {
  query: MockQuery
}

const OUTCOME_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
]

export function StakeTimeline({ query }: StakeTimelineProps) {
  const total = query.totalStakedByOutcome.reduce((a, b) => a + b, 0)
  const sorted = [...query.stakes].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="h-full">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-900">Previous stakes</h4>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total staked</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatRep(total)} REP
          </p>
        </div>
      </div>

      {total > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-gray-100">
            {query.outcomes.map((_, i) => {
              const amt = query.totalStakedByOutcome[i] ?? 0
              if (amt <= 0) return null
              return (
                <div
                  key={i}
                  className={`${OUTCOME_COLORS[i % OUTCOME_COLORS.length]}`}
                  style={{ width: `${(amt / total) * 100}%` }}
                  title={`${query.outcomes[i]}: ${formatRep(amt)}`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {query.outcomes.map((label, i) => {
              const amt = query.totalStakedByOutcome[i] ?? 0
              if (amt <= 0) return null
              return (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span
                    className={`h-2 w-2 rounded-full ${OUTCOME_COLORS[i % OUTCOME_COLORS.length]}`}
                  />
                  <span>
                    {label}: {formatRep(amt)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">No stakes yet — be the first reporter.</p>
      ) : (
        <ol className="relative space-y-0 border-l border-gray-200 pl-4">
          {sorted.map((s) => (
            <li key={s.id} className="relative pb-4 last:pb-0">
              <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-gray-400 ring-1 ring-gray-200" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {query.outcomes[s.outcomeIndex] ?? `Outcome ${s.outcomeIndex}`}
                    {s.isUser && (
                      <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {truncateAddress(s.owner)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatRep(s.amount)} REP
                  </p>
                  <p className="text-xs text-gray-500">
                    {relativeTime(s.timestamp)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
