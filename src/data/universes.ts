/** Genesis REP supply in universe 0. */
export const GENESIS_SUPPLY = 6_000_000

/** Share of parent supply that migrates to the Polymarket-correct child. */
export const CORRECT_SHARE = 0.95

/** Fork bond as a fraction of a universe's REP supply. */
export const FORK_BOND_FRACTION = 0.004

export type ForkQueryKind = 'categorical' | 'scalar' | 'rawIds'

export interface ForkOutcome {
  /** Display label for the button (or outcome id string). */
  label: string
  /** Child universe created by this outcome, if any. */
  childUniverseId?: number
  /** True when this was the Polymarket-resolved / majority-correct outcome. */
  isCorrect?: boolean
}

export interface ForkQuery {
  /** Short title shown above the query body. */
  title: string
  /**
   * Full query body. May include trailing `[00=Yes,01=No,FF=Invalid]` encoding.
   * Omitted encoding (rawIds) shows numeric outcome buttons instead.
   */
  queryText: string
  kind: ForkQueryKind
  /** For scalar queries: divide reported value by 10^decimals. */
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

  const fork0: ForkQuery = {
    title: '2024 US Presidential Election',
    queryText:
      'Will Donald Trump win the 2024 United States presidential election? [00=Yes,01=No,FF=Invalid]',
    kind: 'categorical',
    outcomes: [
      { label: 'Yes', childUniverseId: 1, isCorrect: true },
      { label: 'No', childUniverseId: 2 },
      { label: 'Invalid' },
    ],
    allowCustomOutcome: true,
  }

  const fork1: ForkQuery = {
    title: 'Trump inauguration',
    queryText:
      'Will Donald Trump be inaugurated as President of the United States on January 20, 2025? [00=Yes,01=No,FF=Invalid]',
    kind: 'categorical',
    outcomes: [
      { label: 'Yes', childUniverseId: 3, isCorrect: true },
      { label: 'No', childUniverseId: 4 },
      { label: 'Invalid' },
    ],
    allowCustomOutcome: true,
  }

  // Scalar + missing outcomes= encoding: buttons show 0, 1, Invalid, empty box.
  const fork4: ForkQuery = {
    title: 'Bitcoin price at 2024 election midnight (scalar)',
    queryText:
      'What was the BTC/USD price on Coinbase at 00:00 UTC on November 6, 2024? Report the integer USD price; the UI divides by 10^decimals where decimals=0.',
    kind: 'scalar',
    decimals: 0,
    outcomes: [
      { label: '0', childUniverseId: 5, isCorrect: true },
      { label: '1', childUniverseId: 6 },
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
