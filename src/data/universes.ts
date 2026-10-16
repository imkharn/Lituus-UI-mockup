import { INVALID_OUTCOME_HEX, outcomeIdHex } from '../lib/outcomeId'

/** Genesis REP supply in universe 0. */
export const GENESIS_SUPPLY = 6_000_000

/** Share of parent supply that migrates to the Polymarket-correct child. */
export const CORRECT_SHARE = 0.95

/** Fork bond as a fraction of a universe's REP supply. */
export const FORK_BOND_FRACTION = 0.004

export type ForkQueryKind = 'categorical' | 'scalar' | 'rawIds'

export interface ForkOutcome {
  /** Display label for the button (human-readable). */
  label: string
  /** On-chain / encoding outcome id shown in gray beside the button. */
  outcomeId: string
  /** Child universe created by this outcome, if any. */
  childUniverseId?: number
  /** True when this was the Polymarket-resolved / majority-correct outcome. */
  isCorrect?: boolean
}

export interface ForkQuery {
  /** Short title shown above the query body. */
  title: string
  /**
   * Full query body. Categorical queries append creator outcomes only
   * (e.g. `[00=Yes,01=No]`). Invalid is never encoded here — the system
   * adds it after creation. Scalar forks omit that encoding.
   */
  queryText: string
  kind: ForkQueryKind
  /** For scalar queries: answer = outcomeId / 10^decimals (display convention). */
  decimals?: number
  outcomes: ForkOutcome[]
  /** When true, also show Invalid + free-form outcome-id input. */
  allowCustomOutcome?: boolean
}

export interface UniverseNode {
  id: number
  parentId: number | null
  /** Computed REP supply that migrated into this universe. */
  supply: number
  /** Present when this universe has already forked (has or will have children). */
  forkQuery?: ForkQuery
  /** Child universe ids, in creation order. Empty if unforked leaf. */
  childIds: number[]
  /**
   * Soft-forked from the Affirm/Fork leaf UI: marked forked but no children
   * (and no universe ids) assigned yet. Selecting it later would mint children.
   */
  pendingFork?: {
    question: string
    outcomes: string[]
    kind: ForkQueryKind
    decimals?: number
  }
}

/**
 * Controversial Polymarket / UMA-style resolution forks.
 *
 * Tree:
 *   0
 *   ├── 1 (95% — Trump wins 2024)
 *   │   ├── 3 (95% — TRUE — Trump inaugurated)  ← current / true universe
 *   │   └── 4 (5%)
 *   │       ├── 5 (95%)
 *   │       └── 6 (5%)
 *   └── 2 (5% — Trump loses)
 */
function buildUniverses(): Record<number, UniverseNode> {
  const u0Supply = GENESIS_SUPPLY
  const u1Supply = u0Supply * CORRECT_SHARE
  const u2Supply = u0Supply * (1 - CORRECT_SHARE)
  const u3Supply = u1Supply * CORRECT_SHARE
  const u4Supply = u1Supply * (1 - CORRECT_SHARE)
  const u5Supply = u4Supply * CORRECT_SHARE
  const u6Supply = u4Supply * (1 - CORRECT_SHARE)

  // Controversial Polymarket-style markets that actually divided traders.
  // Outcome encodings omit Invalid — Invalid is appended by the system, not the query creator.
  const fork0: ForkQuery = {
    title: 'Presidential Election Winner 2024',
    queryText: `Will Donald Trump win the 2024 US Presidential Election? This market resolves to Yes if Donald J. Trump is the projected winner of the 2024 United States presidential election according to a consensus of major decision desks (Associated Press, Fox News, NBC, CNN, and ABC) calling the race, or if he receives a majority of electoral votes as certified by Congress on January 6, 2025 — whichever is first unambiguous. Third-party or write-in winners, a contingent House election under the 12th Amendment that does not produce Trump, or a failure to certify by the resolution deadline resolve Invalid. [00=Yes,01=No]`,
    kind: 'categorical',
    outcomes: [
      {
        label: 'Yes',
        outcomeId: outcomeIdHex(0),
        childUniverseId: 1,
        isCorrect: true,
      },
      { label: 'No', outcomeId: outcomeIdHex(1), childUniverseId: 2 },
      { label: 'Invalid', outcomeId: INVALID_OUTCOME_HEX },
    ],
    allowCustomOutcome: true,
  }

  const fork1: ForkQuery = {
    title: 'Trump Inauguration — January 20, 2025',
    queryText: `Will Donald Trump be inaugurated as President of the United States on January 20, 2025? This market resolves Yes if Trump takes the presidential oath of office on January 20, 2025 (US Eastern Time), as the ceremony is conducted under the Twentieth Amendment — including if the public ceremony is relocated, delayed within that calendar day, or held indoors for security/weather. It resolves No if any other person is inaugurated that day, if inauguration is postponed past January 20, 2025, or if Trump does not take the oath that day. Disputes that make the oath's occurrence or date genuinely indeterminate resolve Invalid. [00=Yes,01=No]`,
    kind: 'categorical',
    outcomes: [
      {
        label: 'Yes',
        outcomeId: outcomeIdHex(0),
        childUniverseId: 3,
        isCorrect: true,
      },
      { label: 'No', outcomeId: outcomeIdHex(1), childUniverseId: 4 },
      { label: 'Invalid', outcomeId: INVALID_OUTCOME_HEX },
    ],
    allowCustomOutcome: true,
  }

  // Scalar, no outcomes= encoding in query text. Adjacent cent prices; decimals=2.
  // Shown formula: outcomeId = answer / 10^decimals.
  const btcA = 75432.5
  const btcB = 75432.51
  const btcDecimals = 2
  const fork4: ForkQuery = {
    title: 'Bitcoin price on election night (Nov 6, 2024)',
    queryText:
      'What was the BTC/USD last trade price on Coinbase at 00:00:00 UTC on November 6, 2024 (the first midnight UTC after US polls closed on Election Day 2024)? Use the Coinbase Advanced Trade BTC-USD ticker; if that feed is unavailable, fall back to the Coinbase spot BTC-USD price at that timestamp. Report the price in US dollars and cents. If multiple prints share that exact second, use the last trade stamped at or immediately before 00:00:00 UTC.',
    kind: 'scalar',
    decimals: btcDecimals,
    outcomes: [
      {
        label: btcA.toFixed(btcDecimals),
        outcomeId: String(btcA / 10 ** btcDecimals),
        childUniverseId: 5,
        isCorrect: true,
      },
      {
        label: btcB.toFixed(btcDecimals),
        outcomeId: String(btcB / 10 ** btcDecimals),
        childUniverseId: 6,
      },
    ],
    allowCustomOutcome: true,
  }

  return {
    0: {
      id: 0,
      parentId: null,
      supply: u0Supply,
      forkQuery: fork0,
      childIds: [1, 2],
    },
    1: {
      id: 1,
      parentId: 0,
      supply: u1Supply,
      forkQuery: fork1,
      childIds: [3, 4],
    },
    2: {
      id: 2,
      parentId: 0,
      supply: u2Supply,
      childIds: [],
    },
    3: {
      id: 3,
      parentId: 1,
      supply: u3Supply,
      childIds: [],
    },
    4: {
      id: 4,
      parentId: 1,
      supply: u4Supply,
      forkQuery: fork4,
      childIds: [5, 6],
    },
    5: {
      id: 5,
      parentId: 4,
      supply: u5Supply,
      childIds: [],
    },
    6: {
      id: 6,
      parentId: 4,
      supply: u6Supply,
      childIds: [],
    },
  }
}

export const TRUE_UNIVERSE_ID = 3

export const initialUniverses = buildUniverses()

export function forkBondRep(supply: number): number {
  return Math.round(supply * FORK_BOND_FRACTION * 100) / 100
}

export function nextUniverseId(universes: Record<number, UniverseNode>): number {
  return Math.max(...Object.keys(universes).map(Number), 0) + 1
}

export function hasForked(u: UniverseNode): boolean {
  return Boolean(u.forkQuery || u.pendingFork || u.childIds.length > 0)
}
