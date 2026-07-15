import { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { TabId } from './types/query'
import { useQueries } from './hooks/useQueries'
import { Header } from './components/layout/Header'
import { Toast } from './components/layout/Toast'
import { ReportTab } from './components/report/ReportTab'
import { QueryTab } from './components/query/QueryTab'
import { StatsTab } from './components/stats/StatsTab'

const DARK_STORAGE_KEY = 'lituus-dark'

export default function App() {
  const [tab, setTab] = useState<TabId>('report')
  const [dark, setDark] = useState(() => {
    try {
      return (localStorage.getItem(DARK_STORAGE_KEY) ?? '1') === '1'
    } catch {
      return true
    }
  })
  const {
    queries,
    wallet,
    toast,
    stake,
    claim,
    migrate,
    createQuery,
    clearToast,
  } = useQueries()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(DARK_STORAGE_KEY, dark ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [dark])

  return (
    <>
      <div
        className={clsx('min-h-screen bg-[#fafafa]', dark && 'dark-invert')}
      >
        <Header
          activeTab={tab}
          onTabChange={setTab}
          repBalance={wallet.repBalance}
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
        />

        <main>
          {tab === 'report' && (
            <ReportTab
              queries={queries}
              walletBalance={wallet.repBalance}
              onStake={stake}
              onClaim={claim}
              onMigrate={migrate}
            />
          )}
          {tab === 'query' && (
            <QueryTab
              walletBalance={wallet.repBalance}
              onCreate={createQuery}
            />
          )}
          {tab === 'stats' && <StatsTab />}
        </main>
      </div>

      <Toast message={toast} onClose={clearToast} dark={dark} />
    </>
  )
}
