import type { ChartPoint, MockQuery, MockStats, MockWallet, StakeEvent } from '../types/query'
import { FORK_BOND_REP, PROTOCOL_FEE_REP } from '../lib/profit'

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

const FEE = PROTOCOL_FEE_REP

const e1 = escalation(
  '1',
  FEE,
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
  FEE,
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
  FEE,
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
  FEE,
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
    { owner: R3, outcome: 2 },
    { owner: R1, outcome: 0 },
    { owner: R2, outcome: 1 },
    { owner: R3, outcome: 0 },
    { owner: R1, outcome: 2 },
    { owner: USER, outcome: 1, isUser: true },
  ],
  [18, 3, 21, 7, 15, 22, 9, 4, 19, 11, 2, 16, 8, 23, 5, 13, 20, 6, 14],
  8,
)

const e3 = escalation(
  '3',
  FEE,
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

const e5 = escalation('5', FEE, 3, [{ owner: R1, outcome: 1 }], [], 10)

const e6 = escalation(
  '6',
  FEE,
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
  FEE,
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
  FEE,
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

const e13 = escalation('13', FEE, 3, [{ owner: R1, outcome: 1 }], [], 6)
const e14 = escalation('14', FEE, 3, [{ owner: R2, outcome: 1 }], [], 2)

const e20 = escalation(
  '20',
  FEE,
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

const e21 = escalation('21', FEE, 3, [{ owner: R1, outcome: 1 }], [], 200)
const e22 = escalation('22', FEE, 3, [{ owner: R2, outcome: 1 }], [], 300)

export const initialQueries: MockQuery[] = [
  {
    id: 1,
    question: 'Will a spot Ethereum ETF be approved by Q3? [0=false,1=true]',
    description:
      'This market resolves Yes if the U.S. Securities and Exchange Commission grants final approval for at least one spot Ethereum exchange-traded fund to begin trading on or before September 30, 2025, 11:59 PM ET. Approval of a futures-based ETF does not count. The resolution source is the official SEC filing record (sec.gov). If no spot ETH ETF is approved by the deadline, this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Will the SEC approve a spot Solana ETF this year? [0=false,1=true]',
    description:
      'This market resolves Yes if the U.S. Securities and Exchange Commission approves at least one spot Solana exchange-traded fund for trading before December 31, 2025, 11:59 PM ET. The resolution source is the official SEC EDGAR filing record. Futures-based products and applications that are merely acknowledged (but not approved) do not count. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    description:
      'This market resolves Yes if the front-month WTI crude oil futures contract (CL1) settles at or above $90.00 per barrel on any trading day during the current calendar month, per the official NYMEX settlement price published by CME Group. Intraday spikes that do not hold into the settlement price do not count. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Who will win the 2024 US presidential election? [00=Trump,01=Harris,02=Other]',
    description:
      'This market resolves to the winner of the 2024 United States presidential election. The winning candidate is the one who receives a majority of votes in the Electoral College, as certified by the U.S. Congress on January 6, 2025. "Other" covers any candidate besides Donald Trump or Kamala Harris. If the election is not certified by the resolution deadline, or the result is genuinely undetermined, this market resolves Invalid.',
    outcomes: ['Trump', 'Harris', 'Other', 'Invalid'],
    fee: FEE,
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
        { outcomeIndex: 0, label: 'Trump' },
        { outcomeIndex: 1, label: 'Harris' },
        { outcomeIndex: 2, label: 'Other' },
        { outcomeIndex: 3, label: 'Invalid' },
      ],
      migrateAmount: 2500,
      selectedChild: 0,
    },
  },
  {
    id: 3,
    question: 'Did Bitcoin exceed $100,000 in 2025? [0=false,1=true]',
    description:
      'This market resolves Yes if the price of Bitcoin (BTC/USD) traded at or above $100,000 at any point during the 2025 calendar year, according to the Coinbase Pro BTC-USD spot price. A single confirmed print at or above the threshold is sufficient. This market has resolved Yes.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Will the Fed cut rates at the March FOMC meeting? [0=false,1=true]',
    description:
      'This market resolves Yes if the U.S. Federal Reserve lowers its target range for the federal funds rate at the March Federal Open Market Committee meeting, as stated in the official FOMC policy statement. A hold or a hike resolves No. An unscheduled emergency cut before the meeting does not count toward this market.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 30 * HOUR,
    appealBond: FEE,
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
    question: 'Will SpaceX successfully land Starship this year? [0=false,1=true]',
    description:
      'This market resolves Yes if SpaceX completes a controlled soft landing of a Starship upper stage (either on a landing pad or via an ocean/tower catch that SpaceX officially declares a success) during the current calendar year. The resolution source is official SpaceX communications and live webcast confirmation. A booster-only catch does not satisfy this market. Otherwise it resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Will the UK rejoin the European Union by 2030? [0=false,1=true]',
    description:
      'This market resolves Yes if the United Kingdom becomes a full member state of the European Union on or before December 31, 2030, as confirmed by the official EU membership register. A formal accession treaty entering into force is required; associate membership, single-market access, or a signed-but-not-ratified agreement does not count. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Will global average temperature exceed +1.5°C by 2030? [0=false,1=true]',
    description:
      'This market resolves Yes if any single calendar year on or before 2030 records a global mean surface temperature at least 1.5°C above the pre-industrial (1850–1900) baseline, according to the primary dataset published by NASA GISS or the Copernicus Climate Change Service. A single qualifying year is sufficient. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Will OpenAI publicly release a system it calls AGI in 2026? [0=false,1=true]',
    description:
      'This market resolves Yes if, during the 2026 calendar year, OpenAI publicly releases or announces general availability of a system that OpenAI itself officially designates as "AGI" (artificial general intelligence) in a formal announcement or product page. Informal remarks, research previews, or third-party characterizations do not count. Because "AGI" is contested and may be ambiguous, reporters should resolve Invalid if no clear official designation exists. Otherwise it resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Will Ethereum base fees average under 5 gwei this month? [0=false,1=true]',
    description:
      'This market resolves Yes if the mean Ethereum base fee across all blocks in the current calendar month is below 5 gwei, computed from on-chain data via Etherscan\'s gas tracker daily averages. The average is weighted equally per block. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 10 * HOUR,
    appealBond: FEE,
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
    description:
      'This market resolves Yes if Apple begins retail sales of a dedicated augmented-reality glasses product (a lightweight worn-on-the-face eyewear device, distinct from the Vision Pro headset) to consumers during the current calendar year, per official Apple newsroom announcements and store availability. A pre-order or announcement without units shipping to customers does not count. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 66 * HOUR,
    appealBond: FEE,
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
    question: 'Will Tesla deliver 3 million vehicles this year? [0=false,1=true]',
    description:
      'This market resolves Yes if Tesla, Inc. reports total global vehicle deliveries of 3,000,000 or more for the current calendar year, as stated in Tesla\'s official quarterly and annual delivery/production reports. Production figures do not count — only deliveries. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 68 * HOUR,
    appealBond: FEE,
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
    question: 'Will the UEFA Champions League run with 36 teams this season? [0=false,1=true]',
    description:
      'This market resolves Yes if the UEFA Champions League group/league phase for the current season features 36 clubs under the "Swiss model" format, as confirmed by the official competition regulations published by UEFA. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 63 * HOUR,
    appealBond: FEE,
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
    question: 'Will the Bank of Japan raise its policy rate this quarter? [0=false,1=true]',
    description:
      'This market resolves Yes if the Bank of Japan increases its short-term policy interest rate at any monetary policy meeting held during the current calendar quarter, per the official BOJ statement on monetary policy. A hold or a cut resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Will Nvidia reach a $4 trillion market cap? [0=false,1=true]',
    description:
      'This market resolves Yes if Nvidia Corporation (NVDA) reaches an intraday or closing market capitalization of $4,000,000,000,000 or more, based on shares outstanding from its latest SEC filing multiplied by the NASDAQ share price. A single confirmed print at or above the threshold is sufficient. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Will the WHO declare a new pandemic this year? [0=false,1=true]',
    description:
      'This market resolves Yes if the World Health Organization formally characterizes a new disease outbreak as a pandemic, or declares a new Public Health Emergency of International Concern (PHEIC) for a novel pathogen, during the current calendar year, per official WHO announcements. Continuations of previously declared emergencies do not count. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 36 * HOUR,
    appealBond: FEE,
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
    question: 'Will the EU adopt an AI Act amendment this year? [0=false,1=true]',
    description:
      'This market resolves Yes if the European Union formally adopts an amendment to the AI Act (Regulation (EU) 2024/1689) that is published in the Official Journal of the European Union during the current calendar year. Proposals, draft texts, or trilogue agreements that are not yet published as adopted law do not count. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 14 * HOUR,
    appealBond: FEE,
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
    question: 'Will Solana surpass Ethereum in daily transactions this month? [0=false,1=true]',
    description:
      'This market resolves Yes if, on any single day during the current calendar month, the Solana network processes more successful non-vote transactions than the Ethereum mainnet processes transactions, per the daily figures reported by a recognized on-chain analytics provider (e.g., Artemis or Dune). Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 2 * HOUR,
    appealBond: FEE,
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
    question: 'Which party wins the 2028 US presidential election? [0=Democrat,1=Republican,2=Independent]',
    description:
      'This market resolves to the party of the candidate who wins the 2028 United States presidential election, determined by a majority of Electoral College votes as certified by the U.S. Congress in January 2029. "Independent" covers any winner not nominated by the Democratic or Republican parties. If the result is not certified by the resolution deadline, this market resolves Invalid.',
    outcomes: ['Democrat', 'Republican', 'Independent', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 60 * HOUR,
    appealBond: FEE,
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
    question: 'Will Argentina officially dollarize by 2027? [0=false,1=true]',
    description:
      'This market resolves Yes if the Republic of Argentina formally adopts the U.S. dollar as its official legal tender, replacing the peso, through legislation or executive decree that takes effect on or before December 31, 2027, per official Argentine government publications. A currency peg or partial dollarization short of full legal-tender replacement does not count. Otherwise this market resolves No.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
    createdAt: NOW - 64 * HOUR,
    appealBond: FEE,
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
    question: 'Did the Ethereum Merge complete successfully? [0=false,1=true]',
    description:
      'This market resolves Yes if the Ethereum network successfully transitioned from proof-of-work to proof-of-stake consensus (the "Merge") without a persistent chain split that retained majority economic activity on proof-of-work. The resolution source is the Ethereum Foundation\'s official confirmation. This market has resolved Yes.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Did the 2024 Paris Olympics opening ceremony occur on schedule? [0=false,1=true]',
    description:
      'This market resolves Yes if the opening ceremony of the 2024 Summer Olympic Games in Paris took place on its officially scheduled date of July 26, 2024, per the International Olympic Committee. This market has resolved Yes.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
    question: 'Did the Bitcoin halving occur in April 2024? [0=false,1=true]',
    description:
      'This market resolves Yes if the Bitcoin block subsidy halving (the reduction from 6.25 to 3.125 BTC per block at block height 840,000) occurred during April 2024, per on-chain block timestamps. This market has resolved Yes.',
    outcomes: ['No', 'Yes', 'Invalid'],
    fee: FEE,
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
