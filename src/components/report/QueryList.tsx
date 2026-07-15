import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { MockQuery, SortMode } from '../../types/query'
import { loadSortMode, saveSortMode, sortQueries } from '../../lib/sorting'
import { QueryRow } from './QueryRow'

interface QueryListProps {
  queries: MockQuery[]
  walletBalance: number
  onStake: (queryId: number, outcomeIndex: number, amount: number) => void
  onClaim: (queryId: number) => void
  onMigrate: (queryId: number, childLabel: string, amount: number) => void
}

function requiredBadge(q: MockQuery): string | undefined {
  if (q.userHasLosingBond || q.category === 'required_appeal_urgent') {
    return 'Appeal required'
  }
  if (q.forkInfo) return 'Fork migration'
  return undefined
}

export function QueryList({
  queries,
  walletBalance,
  onStake,
  onClaim,
  onMigrate,
}: QueryListProps) {
  const [sortMode, setSortMode] = useState<SortMode>(() => loadSortMode())
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const sections = useMemo(
    () => sortQueries(queries, sortMode),
    [queries, sortMode],
  )

  const setMode = (mode: SortMode) => {
    setSortMode(mode)
    saveSortMode(mode)
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reporting</h2>
          <p className="text-sm text-gray-500">
            {sortMode === 'smart'
              ? 'Queries you are most likely to interact with, ordered by urgency and profit.'
              : 'Queries that are next to expire.'}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-gray-50 p-0.5">
          <button
            type="button"
            onClick={() => setMode('smart')}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              sortMode === 'smart'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Smart sort
          </button>
          <button
            type="button"
            onClick={() => setMode('expire')}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              sortMode === 'expire'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Next to expire
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="hidden border-b border-border bg-gray-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-gray-500 lg:grid lg:grid-cols-[auto_minmax(0,2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,0.85fr)] lg:gap-3 lg:px-6 lg:pl-[3.25rem]">
        <span />
        <span>Title</span>
        <span>Outcome</span>
        <span>Bond</span>
        <span>Available profit</span>
        <span>Time remaining</span>
      </div>

      {sections.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-gray-500 sm:px-6">
          No open queries right now.
        </p>
      ) : (
        sections.map((section) => (
          <div key={`${section.tier}-${section.label}`}>
            <div className="flex items-center justify-between border-b border-border bg-gray-50/80 px-4 py-1 sm:px-6 lg:px-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {section.label}
              </h3>
              {section.tier === 'claim' && section.queries.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    for (const q of section.queries) onClaim(q.id)
                  }}
                  className="rounded-md bg-augur-green px-2.5 py-1 text-xs font-semibold text-white hover:bg-augur-green-dark"
                >
                  Claim all
                </button>
              )}
            </div>
            {section.queries.map((q) => (
              <QueryRow
                key={q.id}
                query={q}
                expanded={expandedId === q.id}
                onToggle={() =>
                  setExpandedId((id) => (id === q.id ? null : q.id))
                }
                walletBalance={walletBalance}
                onStake={(outcome, amount) => onStake(q.id, outcome, amount)}
                onClaim={() => onClaim(q.id)}
                onMigrate={(childLabel, amount) =>
                  onMigrate(q.id, childLabel, amount)
                }
                badge={
                  section.tier === 'required' ? requiredBadge(q) : undefined
                }
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
