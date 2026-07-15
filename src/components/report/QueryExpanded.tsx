import type { MockQuery } from '../../types/query'
import { StakeForm } from './StakeForm'
import { StakeTimeline } from './StakeTimeline'

interface QueryExpandedProps {
  query: MockQuery
  walletBalance: number
  onStake: (outcomeIndex: number, amount: number) => void
  onClaim: () => void
  onMigrate: (childLabel: string, amount: number) => void
}

export function QueryExpanded({
  query,
  walletBalance,
  onStake,
  onClaim,
  onMigrate,
}: QueryExpandedProps) {
  return (
    <div className="border-t border-border bg-white px-4 py-3 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <StakeForm
            query={query}
            walletBalance={walletBalance}
            onStake={onStake}
            onClaim={onClaim}
            onMigrate={onMigrate}
          />
        </div>
        <div className="min-w-0 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="hidden md:block">
            <StakeTimeline query={query} />
          </div>
          <div className="md:hidden">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Previous stakes
              </summary>
              <div className="mt-3">
                <StakeTimeline query={query} />
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
