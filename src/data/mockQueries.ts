import type { ChartPoint, MockQuery, MockStats, MockWallet, StakeEvent } from '../types/query'
import { FORK_BOND_REP } from '../lib/profit'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const NOW = Date.now()

const USER = '0xA11cE0000000000000000000000000000000b0b'
const R1 = '0x1111111111111111111111111111111111111111'
const R2 = '0x2222222222222222222222222222222222222222'
const R3 = '0x3333333333333333333333333333333333333333'

export const MOCK_USER_ADDRESS = USER

export const initialWallet: MockWallet = {
  address: USER,
  repBalance: 12450,
}

/** Bond size for round i (0-based). Caps at fork bond once double would hit half the fork bond. */
function bondAtRound(fee: number, round: number): number {
  let amount = fee
  for (let i = 0; i < round; i++) {
    const next = amount * 2
    amount = next >= FORK_BOND_REP / 2 ? FORK_BOND_REP : next
  }
  return amount
}

/**
 * Build a realistic escalation history: each stake doubles the previous bond,
 * with a fixed gap of `gapsHours[i]` (0–24) between consecutive stakes.
 * `hoursSinceLast` is how long ago the most recent stake was placed.
 */
function escalation(
  idPrefix: string,
  fee: number,
  outcomeCount: number,
  rounds: Array<{ owner: string; outcome: number; isUser?: boolean }>,
  gapsHours: number[],
  hoursSinceLast: number,
): { stakes: StakeEvent[]; totals: number[]; lastBond: number; nextBond: number } {
  const stakes: StakeEvent[] = []
  const totals = Array.from({ length: outcomeCount }, () => 0)
  let t = NOW - hoursSinceLast * HOUR

  for (let i = rounds.length - 1; i >= 0; i--) {
    const amount = bondAtRound(fee, i)
    const r = rounds[i]
    stakes.unshift({
      id: `${idPrefix}-${i}`,
      owner: r.owner,
      isUser: Boolean(r.isUser),
      outcomeIndex: r.outcome,
      amount,
      timestamp: t,
    })
    totals[r.outcome] += amount
    if (i > 0) {
      const gap = Math.min(24, Math.max(0, gapsHours[i - 1] ?? 12))
      t -= gap * HOUR
    }
  }

  const lastBond = bondAtRound(fee, rounds.length - 1)
  const nextBond = bondAtRound(fee, rounds.length)
  return { stakes, totals, lastBond, nextBond }
}

const INVALID_BINARY = 2

const e1 = escalation(
  '1',
  5,
  3,
  [
    { owner: USER, outcome: 1, isUser: true },
    { owner: R1, outcome: 0 },
  ],
  [14.2],
  23.93, // ~4 min left in the 24h appeal window
)

/** Second bond-at-risk: user reported, then got appealed — must restake soon. */
const e1b = escalation(
  '1b',
  4,
  3,
  [
    { owner: USER, outcome: 0, isUser: true },
    { owner: R2, outcome: 1 },
  ],
  [8.6],
  23.7, // ~18 min left
)

/** Third bond-at-risk: user lost the latest round and must appeal. */
const e1c = escalation(
  '1c',
  3,
  3,
  [
    { owner: R1, outcome: 1 },
    { owner: USER, outcome: 0, isUser: true },
    { owner: R3, outcome: 1 },
  ],
  [19.4, 11.2],
  23.25, // ~45 min left
)

const e2 = escalation(
  '2',
  6,
  4,
  [
    { owner: R1, outcome: 0 },
    { owner: R2, outcome: 1 },
    { owner: R3, outcome: 0 },
    { owner: R1, outcome: 1 },
    { owner: R2, outcome: 2 },
    { owner: R3, outcome: 0 },
    { owner: R1, outcome: 1 },
    { owner: R2, outcome: 0 },
    { owner: R3, outcome: 1 },
    { owner: R1, outcome: 2 },
    { owner: R2, outcome: 0 },
    { owner: R3, outcome: 1 },
    { owner: R1, outcome: 0 },
    { owner: R2, outcome: 1 },
    { owner: R3, outcome: 0 },
    { owner: R1, outcome: 1 },
    { owner: R2, outcome: 2 },
    { owner: R3, outcome: 0 },
    { owner: R1, outcome: 1 },
    { owner: USER, outcome: 1, isUser: true },
  ],
  [18, 3, 21, 7, 15, 22, 9, 4, 19, 11, 2, 16, 8, 23, 5, 13, 20, 6, 14],
  8,
)

const e3 = escalation(
  '3',
  5,
  3,
  [
    { owner: R1, outcome: 0 },
    { owner: USER, outcome: 1, isUser: true },
    { owner: R2, outcome: 0 },
    { owner: USER, outcome: 1, isUser: true },
  ],
  [11.5, 19.2, 6.8],
  30,
)

const e5 = escalation('5', 6, 3, [{ owner: R1, outcome: 1 }], [], 10)

const e6 = escalation(
  '6',
  4,
  3,
  [
    { owner: R1, outcome: 0 },
    { owner: R2, outcome: 1 },
  ],
  [17.4],
  6,
)

const e7 = escalation(
  '7',
  4,
  3,
  [
    { owner: R1, outcome: 1 },
    { owner: R2, outcome: 0 },
    { owner: R3, outcome: 1 },
  ],
  [22.1, 9.5],
  8,
)

const e8 = escalation(
  '8',
  5,
  3,
  [
    { owner: R1, outcome: 0 },
    { owner: R2, outcome: 1 },
    { owner: R3, outcome: 0 },
    { owner: R1, outcome: 1 },
    { owner: R2, outcome: 0 },
    { owner: R3, outcome: 1 },
    { owner: R1, outcome: 0 },
    { owner: R2, outcome: 1 },
    { owner: R3, outcome: 0 },
    { owner: R1, outcome: 1 },
    { owner: R2, outcome: 0 },
    { owner: R3, outcome: 1 },
    { owner: R1, outcome: 0 },
    { owner: R2, outcome: 1 },
    { owner: R3, outcome: 0 },
    { owner: R1, outcome: 1 },
    { owner: R2, outcome: 0 },
    { owner: R3, outcome: 1 },
    { owner: R1, outcome: 0 },
  ],
  [12, 5, 20, 8, 16, 3, 22, 11, 7, 18, 4, 15, 9, 21, 2, 14, 19, 6],
  4,
)

const e13 = escalation('13', 9, 3, [{ owner: R1, outcome: 1 }], [], 6)
const e14 = escalation('14', 6.5, 3, [{ owner: R2, outcome: 1 }], [], 2)

const e20 = escalation(
  '20',
  3,
  3,
  [
    { owner: R1, outcome: 0 },
    { owner: USER, outcome: 1, isUser: true },
    { owner: R2, outcome: 0 },
    { owner: USER, outcome: 1, isUser: true },
  ],
  [8.3, 21.7, 13.1],
  28,
)

const e21 = escalation('21', 2, 3, [{ owner: R1, outcome: 1 }], [], 200)
const e22 = escalation('22', 2, 3, [{ owner: R2, outcome: 1 }], [], 300)

export const initialQueries: MockQuery[] = [
  {
    id: 1,
    question: 'Will ETH ETF approval happen by Q3? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 5,
    createdAt: e1.stakes[0].timestamp - 7 * HOUR,
    appealBond: e1.nextBond,
    tentativeOutcome: 0,
    finalOutcome: null,
    totalStakedByOutcome: e1.totals,
    stakes: e1.stakes,
    timeRemainingMs: 4 * MIN,
    columnMode: 'activeAppeal',
    category: 'required_appeal_urgent',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: true,
    hasOpenAppeal: true,
  },
  {
    id: 23,
    question: 'Will the SEC approve a Solana ETF this year? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 4,
    createdAt: e1b.stakes[0].timestamp - 14 * HOUR,
    appealBond: e1b.nextBond,
    tentativeOutcome: 1,
    finalOutcome: null,
    totalStakedByOutcome: e1b.totals,
    stakes: e1b.stakes,
    timeRemainingMs: 18 * MIN,
    columnMode: 'activeAppeal',
    category: 'required_appeal_urgent',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: true,
    hasOpenAppeal: true,
    tip: 2,
  },
  {
    id: 24,
    question: 'Will crude oil close above $90 this month? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 3,
    createdAt: e1c.stakes[0].timestamp - 3 * HOUR,
    appealBond: e1c.nextBond,
    tentativeOutcome: 1,
    finalOutcome: null,
    totalStakedByOutcome: e1c.totals,
    stakes: e1c.stakes,
    timeRemainingMs: 45 * MIN,
    columnMode: 'activeAppeal',
    category: 'required_appeal_urgent',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: true,
    hasOpenAppeal: true,
  },
  {
    id: 2,
    question: 'Which outcome won the 2024 election fork? [0=A,1=B,2=C]',
    outcomes: ['Candidate A', 'Candidate B', 'Candidate C', 'Invalid'],
    fee: 6,
    createdAt: e2.stakes[0].timestamp - 19 * HOUR,
    appealBond: e2.lastBond,
    tentativeOutcome: 1,
    finalOutcome: null,
    totalStakedByOutcome: e2.totals,
    stakes: e2.stakes,
    timeRemainingMs: 3 * DAY,
    columnMode: 'activeAppeal',
    category: 'required_fork_migrate',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    forkInfo: {
      forkState: 2,
      childUniverses: [
        { outcomeIndex: 0, label: 'Candidate A' },
        { outcomeIndex: 1, label: 'Candidate B' },
        { outcomeIndex: 2, label: 'Candidate C' },
        { outcomeIndex: 3, label: 'Invalid' },
      ],
      migrateAmount: 2500,
      selectedChild: 1,
    },
  },
  {
    id: 3,
    question: 'Did BTC exceed $100k in 2025? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 5,
    createdAt: e3.stakes[0].timestamp - 11 * HOUR,
    appealBond: 0,
    tentativeOutcome: 1,
    finalOutcome: 1,
    totalStakedByOutcome: e3.totals,
    stakes: e3.stakes,
    timeRemainingMs: DAY,
    columnMode: 'preAppeal',
    category: 'claim_winnings',
    isResolved: true,
    claimableAmount: 70,
    userHasLosingBond: false,
    hasOpenAppeal: false,
  },
  {
    id: 4,
    question: 'Will Fed cut rates in March? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 4.2,
    createdAt: NOW - 30 * HOUR,
    appealBond: 4.2,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 42 * HOUR,
    columnMode: 'activeAppeal',
    category: 'awaiting_first_report',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 7,
  },
  {
    id: 5,
    question: 'Will SpaceX land Starship successfully this year? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 6,
    createdAt: e5.stakes[0].timestamp - 22 * HOUR,
    appealBond: e5.nextBond,
    tentativeOutcome: 1,
    finalOutcome: null,
    totalStakedByOutcome: e5.totals,
    stakes: e5.stakes,
    timeRemainingMs: 14 * HOUR,
    columnMode: 'preAppeal',
    category: 'appeal_window',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 3,
  },
  {
    id: 6,
    question: 'Will UK rejoin EU by 2030? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 4,
    createdAt: e6.stakes[0].timestamp - 5 * HOUR,
    appealBond: e6.nextBond,
    tentativeOutcome: 1,
    finalOutcome: null,
    totalStakedByOutcome: e6.totals,
    stakes: e6.stakes,
    timeRemainingMs: 18 * HOUR,
    columnMode: 'activeAppeal',
    category: 'open_appeal_round1',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: true,
  },
  {
    id: 7,
    question: 'Will global temps rise >1.5°C by 2030? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 4,
    createdAt: e7.stakes[0].timestamp - 16 * HOUR,
    appealBond: e7.nextBond,
    tentativeOutcome: 1,
    finalOutcome: null,
    totalStakedByOutcome: e7.totals,
    stakes: e7.stakes,
    timeRemainingMs: 8 * HOUR,
    columnMode: 'activeAppeal',
    category: 'open_appeal_round2',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: true,
  },
  {
    id: 8,
    question: 'Will OpenAI release AGI in 2026? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 5,
    createdAt: e8.stakes[0].timestamp - 8 * HOUR,
    appealBond: e8.nextBond,
    tentativeOutcome: 0,
    finalOutcome: null,
    totalStakedByOutcome: e8.totals,
    stakes: e8.stakes,
    timeRemainingMs: 20 * HOUR,
    columnMode: 'activeAppeal',
    category: 'near_fork_threshold',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: true,
  },
  {
    id: 9,
    question: 'Will Ethereum average under 5 gwei this month? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 3.5,
    createdAt: NOW - 10 * HOUR,
    appealBond: 3.5,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 62 * HOUR,
    columnMode: 'activeAppeal',
    category: 'awaiting_first_report',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 2,
  },
  {
    id: 10,
    question: 'Will Apple release AR glasses this year? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 9,
    createdAt: NOW - 66 * HOUR,
    appealBond: 9,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 6 * HOUR,
    columnMode: 'activeAppeal',
    category: 'smart_sort_high',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 10,
  },
  {
    id: 11,
    question: 'Will Tesla hit 3M deliveries this year? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 2,
    createdAt: NOW - 68 * HOUR,
    appealBond: 2,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 4 * HOUR,
    columnMode: 'activeAppeal',
    category: 'smart_sort_mid',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
  },
  {
    id: 12,
    question: 'Will UEFA expand to 36 teams? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 1.5,
    createdAt: NOW - 63 * HOUR,
    appealBond: 1.5,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 9 * HOUR,
    columnMode: 'activeAppeal',
    category: 'smart_sort_low',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 1,
  },
  {
    id: 13,
    question: 'Will Japan raise rates this quarter? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 9,
    createdAt: e13.stakes[0].timestamp - 2 * HOUR,
    appealBond: e13.nextBond,
    tentativeOutcome: 1,
    finalOutcome: null,
    totalStakedByOutcome: e13.totals,
    stakes: e13.stakes,
    timeRemainingMs: 18 * HOUR,
    columnMode: 'preAppeal',
    category: 'bucket_0_24h_a',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 4,
  },
  {
    id: 14,
    question: 'Will Nvidia top $4T market cap? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 6.5,
    createdAt: e14.stakes[0].timestamp - 18 * HOUR,
    appealBond: e14.nextBond,
    tentativeOutcome: 1,
    finalOutcome: null,
    totalStakedByOutcome: e14.totals,
    stakes: e14.stakes,
    timeRemainingMs: 22 * HOUR,
    columnMode: 'preAppeal',
    category: 'bucket_0_24h_b',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
  },
  {
    id: 15,
    question: 'Will WHO declare a new pandemic this year? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 3,
    createdAt: NOW - 36 * HOUR,
    appealBond: 3,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 36 * HOUR,
    columnMode: 'activeAppeal',
    category: 'bucket_24_48h',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 8,
  },
  {
    id: 16,
    question: 'Will EU pass AI Act amendment this year? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 2.2,
    createdAt: NOW - 14 * HOUR,
    appealBond: 2.2,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 58 * HOUR,
    columnMode: 'activeAppeal',
    category: 'bucket_48_72h',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
  },
  {
    id: 17,
    question: 'Will Solana flip ETH daily tx count this month? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 1.8,
    createdAt: NOW - 2 * HOUR,
    appealBond: 1.8,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 70 * HOUR,
    columnMode: 'activeAppeal',
    category: 'bucket_48_72h',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 5,
  },
  {
    id: 18,
    question: 'Who wins 2028 US election? [0=Democrat,1=Republican,2=Independent]',
    outcomes: ['Democrat', 'Republican', 'Independent', 'Invalid'],
    fee: 5,
    createdAt: NOW - 60 * HOUR,
    appealBond: 5,
    tentativeOutcome: 3,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0, 0],
    stakes: [],
    timeRemainingMs: 12 * HOUR,
    columnMode: 'activeAppeal',
    category: 'multi_outcome',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 6,
  },
  {
    id: 19,
    question: 'Will Argentina dollarize by 2027? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 4,
    createdAt: NOW - 64 * HOUR,
    appealBond: 4,
    tentativeOutcome: INVALID_BINARY,
    finalOutcome: null,
    totalStakedByOutcome: [0, 0, 0],
    stakes: [],
    timeRemainingMs: 8 * HOUR,
    columnMode: 'activeAppeal',
    category: 'with_tip',
    isResolved: false,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    tip: 9,
  },
  {
    id: 20,
    question: 'Did ETH merge succeed? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 3,
    createdAt: e20.stakes[0].timestamp - 9 * HOUR,
    appealBond: 0,
    tentativeOutcome: 1,
    finalOutcome: 1,
    totalStakedByOutcome: e20.totals,
    stakes: e20.stakes,
    timeRemainingMs: DAY,
    columnMode: 'preAppeal',
    category: 'claim_winnings_partial',
    isResolved: true,
    claimableAmount: 42,
    userHasLosingBond: false,
    hasOpenAppeal: false,
  },
  {
    id: 21,
    question: 'Did the 2024 Olympics open on time? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 2,
    createdAt: e21.stakes[0].timestamp - 21 * HOUR,
    appealBond: 0,
    tentativeOutcome: 1,
    finalOutcome: 1,
    totalStakedByOutcome: e21.totals,
    stakes: e21.stakes,
    timeRemainingMs: 0,
    columnMode: 'preAppeal',
    category: 'expired_hidden',
    isResolved: true,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    hidden: true,
  },
  {
    id: 22,
    question: 'Was Bitcoin halving in April 2024? [0=false,1=true]',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: 2,
    createdAt: e22.stakes[0].timestamp - 4 * HOUR,
    appealBond: 0,
    tentativeOutcome: 1,
    finalOutcome: 1,
    totalStakedByOutcome: e22.totals,
    stakes: e22.stakes,
    timeRemainingMs: 0,
    columnMode: 'preAppeal',
    category: 'expired_hidden',
    isResolved: true,
    claimableAmount: 0,
    userHasLosingBond: false,
    hasOpenAppeal: false,
    hidden: true,
  },
]

function buildChartSeries(): ChartPoint[] {
  const points: ChartPoint[] = []
  let fee = 80
  for (let day = 1; day <= 90; day++) {
    const queriesPerDay = Math.max(
      1,
      Math.round(2 + Math.pow(day / 12, 1.4) + Math.sin(day / 7) * 3),
    )
    if (day % 14 === 0) {
      fee = Math.max(40, Math.round(fee * (day < 60 ? 1.12 : 0.92)))
    }
    points.push({ day, queriesPerDay, queryFee: fee })
  }
  const last = points[points.length - 1]
  const lastFee = last.queryFee ?? fee
  last.projectedFee = lastFee
  const projected = Math.round(lastFee * 1.08)
  points.push({
    day: 91,
    queriesPerDay: last.queriesPerDay,
    projectedFee: projected,
  })
  points.push({
    day: 95,
    queriesPerDay: last.queriesPerDay,
    projectedFee: Math.round(projected * 1.05),
  })
  return points
}

export const mockStats: MockStats = {
  averageReporterApy: 14.2,
  percentSupplyStaked: 3.8,
  tvlUsd: 1_280_000,
  estimatedOpenInterest: 24_100_000,
  attackCostUsd: 52_400_000,
  repFdvUsd: 39_104_478,
  securityMargin: 1.34,
  protocolFeeUsd: 42,
  ammPriceUsd: 41,
  repPriceUsd: 10,
  averageBurnUsdPerYear: 39_104_478 / 40,
  chartSeries: buildChartSeries(),
  feeProjectionDirection: 'up',
}
