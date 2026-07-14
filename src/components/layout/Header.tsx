import clsx from 'clsx'
import type { TabId } from '../../types/query'
import { formatRep } from '../../lib/actions'

interface HeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  repBalance: number
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'query', label: 'Query' },
  { id: 'report', label: 'Report' },
  { id: 'stats', label: 'Stats' },
]

export function Header({ activeTab, onTabChange, repBalance }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}augur-logo.svg`}
              alt="Augur"
              className="h-8 w-8"
            />
            <span className="hidden text-lg font-semibold tracking-tight sm:inline">
              Augur Lituus
            </span>
          </div>
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-gray-50 px-3 py-1.5 text-sm">
          <span className="h-2 w-2 rounded-full bg-augur-green" />
          <span className="font-medium text-gray-900">
            {formatRep(repBalance)} REP
          </span>
        </div>
      </div>
    </header>
  )
}
