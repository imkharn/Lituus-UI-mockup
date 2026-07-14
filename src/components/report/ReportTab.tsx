import type { MockQuery } from '../../types/query'
import { mockStats } from '../../data/mockQueries'
import { QueryList } from './QueryList'

interface ReportTabProps {
  queries: MockQuery[]
  walletBalance: number
  onStake: (queryId: number, outcomeIndex: number, amount: number) => void
  onClaim: (queryId: number) => void
  onMigrate: (queryId: number, childOutcome: number) => void
}

export function ReportTab({
  queries,
  walletBalance,
  onStake,
  onClaim,
  onMigrate,
}: ReportTabProps) {
  const openCount = queries.filter(
    (q) => !q.hidden && q.timeRemainingMs > 0 && !q.isResolved,
  ).length

  return (
    <div>
      <div className="report-hero">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <h2 className="report-hero__title text-xl font-semibold tracking-tight sm:text-2xl">
            Stake, report &amp; earn{' '}
            <span className="report-hero__accent">
              {mockStats.averageReporterApy}% APR
            </span>
          </h2>
          <p className="report-hero__sub mt-1.5 text-base">
            Resolve{' '}
            <span className="report-hero__count">{openCount}</span> queries
          </p>
        </div>
      </div>
      <QueryList
        queries={queries}
        walletBalance={walletBalance}
        onStake={onStake}
        onClaim={onClaim}
        onMigrate={onMigrate}
      />
      <section
        id="reporting-guide"
        className="border-t border-border bg-white px-4 py-8 sm:px-6 lg:px-8"
      >
        <h3 className="text-base font-semibold text-gray-900">
          Reporting guide
        </h3>
        <div className="mt-3 max-w-3xl space-y-2 text-sm text-gray-600">
          <p>
            Report the outcome that a reasonable person would conclude from
            publicly available information at resolution time. If the question is
            ambiguous, poorly specified, or outside the intended scope, choose{' '}
            <strong>Invalid</strong>. Queries with no report resolve to Invalid
            after three days.
          </p>
          <p>
            Bonds double each appeal round until the fork bond (~2% of REP
            supply). If you hold the losing side of a recent appeal, you must
            restake before the timer ends or your bond is lost.
          </p>
          <p>
            During a fork, migrate REP into the child universe that matches the
            correct outcome.
          </p>
        </div>
      </section>
    </div>
  )
}
