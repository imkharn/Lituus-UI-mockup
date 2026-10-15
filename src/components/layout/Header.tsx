import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import type { TabId } from '../../types/query'
import { formatRep } from '../../lib/actions'
import { useUniverse } from '../../context/UniverseContext'
import { RepToken } from '../rep/RepToken'
import { SettingsModal } from './SettingsModal'
import { SwitchUniverseModal } from '../universe/SwitchUniverseModal'
import { TrueUniverseFrame } from '../universe/TrueUniverseFrame'

interface HeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  repBalance: number
  dark: boolean
  onToggleDark: () => void
  onAddRep: () => void
  onReset: () => void
  onSkipTime: () => void
  onToast: (message: string) => void
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
  onAddRep,
  onReset,
  onSkipTime,
  onToast,
}: HeaderProps) {
  const { universeId, universes, setUniverseId, createChildUniverse, markPendingFork } =
    useUniverse()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [trueFrameOpen, setTrueFrameOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!walletMenuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setWalletMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [walletMenuOpen])

  return (
    <>
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
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              aria-label="Open settings"
              className="rounded-md border border-border bg-gray-50 p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
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
                    <path
                      d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="stroke-amber-500"
                    />
                  </svg>
                )}
              </span>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setWalletMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-border bg-gray-50 px-3 py-1.5 text-sm hover:bg-gray-100"
              >
                <span className="h-2 w-2 rounded-full bg-augur-green" />
                <span className="font-medium text-gray-900">
                  {formatRep(repBalance)} <RepToken />
                </span>
              </button>

              {walletMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                  <div className="border-b border-border px-4 py-2.5">
                    <p className="text-sm font-semibold text-gray-900">
                      Universe {universeId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletMenuOpen(false)
                      setSwitchOpen(true)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
                  >
                    Switch Universe
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onAddRep={onAddRep}
        onReset={onReset}
        onSkipTime={onSkipTime}
      />

      <SwitchUniverseModal
        open={switchOpen}
        currentUniverseId={universeId}
        onClose={() => setSwitchOpen(false)}
        onGoToUniverse={(id) => {
          if (!universes[id]) {
            onToast(`Universe ${id} does not exist`)
            return
          }
          setUniverseId(id)
          setSwitchOpen(false)
          onToast(`Switched to Universe ${id}`)
        }}
        onGoToTrue={() => {
          setSwitchOpen(false)
          setTrueFrameOpen(true)
        }}
      />

      <TrueUniverseFrame
        open={trueFrameOpen}
        universes={universes}
        walletBalance={repBalance}
        onClose={() => setTrueFrameOpen(false)}
        onAffirm={(id) => {
          setUniverseId(id)
          onToast(`Affirmed Universe ${id} as True`)
        }}
        onCreateChild={createChildUniverse}
        onMarkPendingFork={markPendingFork}
        onToast={onToast}
      />
    </>
  )
}
