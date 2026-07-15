export type ColumnMode = 'preAppeal' | 'activeAppeal'

export type ReporterCategory =
  | 'required_appeal_urgent'
  | 'required_fork_migrate'
  | 'claim_winnings'
  | 'claim_winnings_partial'
  | 'awaiting_first_report'
  | 'appeal_window'
  | 'open_appeal_round1'
  | 'open_appeal_round2'
  | 'near_fork_threshold'
  | 'smart_sort_high'
  | 'smart_sort_mid'
  | 'smart_sort_low'
  | 'bucket_0_24h_a'
  | 'bucket_0_24h_b'
  | 'bucket_24_48h'
  | 'bucket_48_72h'
  | 'multi_outcome'
  | 'with_tip'
  | 'expired_hidden'

export type SortMode = 'smart' | 'expire'

export type TabId = 'query' | 'report' | 'stats'

export interface StakeEvent {
  id: string
  owner: string
  isUser: boolean
  outcomeIndex: number
  amount: number
  timestamp: number
}

export interface ForkInfo {
  forkState: number
  childUniverses: { outcomeIndex: number; label: string }[]
  migrateAmount: number
  selectedChild?: number
}

export interface MockQuery {
  id: number
  question: string
  outcomes: string[]
  fee: number
  createdAt: number
  appealBond: number
  tentativeOutcome: number | null
  finalOutcome: number | null
  totalStakedByOutcome: number[]
  stakes: StakeEvent[]
  timeRemainingMs: number
  columnMode: ColumnMode
  category: ReporterCategory
  isResolved: boolean
  claimableAmount: number
  userHasLosingBond: boolean
  hasOpenAppeal: boolean
  forkInfo?: ForkInfo
  /** Tip in REP, paid to the first correct reporter. */
  tip?: number
  hidden?: boolean
}

export interface MockWallet {
  address: string
  repBalance: number
}

export interface ChartPoint {
  day: number
  queriesPerDay: number
  queryFee?: number
  projectedFee?: number
}

export interface MockStats {
  averageReporterApy: number
  percentSupplyStaked: number
  tvlUsd: number
  estimatedOpenInterest: number | null
  attackCostUsd: number
  /** REP fully diluted valuation used to derive attack cost. */
  repFdvUsd: number
  /** Attack cost / FDV from the Augur Lituus whitepaper (≈1.34). */
  securityMargin: number
  protocolFeeUsd: number
  ammPriceUsd: number
  repPriceUsd: number
  /** Average annual burn in USD since launch (≈ FDV / 40). */
  averageBurnUsdPerYear: number
  chartSeries: ChartPoint[]
  feeProjectionDirection: 'up' | 'down'
}

export type ListTier = 'required' | 'claim' | 'active' | 'bucket'

export interface SortedSection {
  tier: ListTier
  label: string
  queries: MockQuery[]
  bucketIndex?: number
}
