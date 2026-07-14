import { useState } from 'react'
import type { TabId } from './types/query'
import { useQueries } from './hooks/useQueries'
import { Header } from './components/layout/Header'
import { Toast } from './components/layout/Toast'
import { ReportTab } from './components/report/ReportTab'
import { QueryTab } from './components/query/QueryTab'
import { StatsTab } from './components/stats/StatsTab'

export default function App() {
  const [tab, setTab] = useState<TabId>('report')
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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header
        activeTab={tab}
        onTabChange={setTab}
        repBalance={wallet.repBalance}
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
          <QueryTab walletBalance={wallet.repBalance} onCreate={createQuery} />
        )}
        {tab === 'stats' && <StatsTab />}
      </main>

      <Toast message={toast} onClose={clearToast} />
    </div>
  )
}
