import clsx from 'clsx'
import type { TabId } from '../../types/query'
import { formatRep } from '../../lib/actions'

interface HeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  repBalance: number
  dark: boolean
  onToggleDark: () => void
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'query', label: 'Query' },
  { id: 'report', label: 'Report' },
  { id: 'stats', label: 'Stats' },
]

export function Header({
  activeTab,
  onTabChange,
  repBalance,
  dark,
  onToggleDark,
}: HeaderProps) {
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleDark}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
            className={clsx(
              'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
              dark
                ? 'border-gray-700 bg-gray-800'
                : 'border-border bg-gray-200',
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow transition-all',
                dark ? 'left-[24px]' : 'left-0.5',
              )}
            >
              {dark ? (
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-gray-700">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-amber-500">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" className="stroke-amber-500" />
                </svg>
              )}
            </span>
          </button>
          <div className="flex items-center gap-2 rounded-full border border-border bg-gray-50 px-3 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-augur-green" />
            <span className="font-medium text-gray-900">
              {formatRep(repBalance)} REP
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
