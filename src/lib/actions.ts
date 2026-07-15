import type { MockQuery, MockWallet } from '../types/query'
import { initialQueries, initialWallet, MOCK_USER_ADDRESS } from '../data/mockQueries'
import { FORK_BOND_REP } from './profit'

export interface AppState {
  queries: MockQuery[]
  wallet: MockWallet
  toast: string | null
}

export type AppAction =
  | { type: 'STAKE'; queryId: number; outcomeIndex: number; amount: number }
  | { type: 'CLAIM'; queryId: number }
  | { type: 'MIGRATE'; queryId: number; childLabel: string; amount: number }
  | { type: 'TICK'; ms: number }
  | { type: 'CLEAR_TOAST' }
  | { type: 'ADD_REP'; amount: number }
  | { type: 'RESET' }
  | { type: 'SKIP_TIME'; ms: number }
  | {
      type: 'CREATE_QUERY'
      question: string
      outcomes: string[]
      fee: number
      tip?: number
    }

function nextId(queries: MockQuery[]): number {
  return Math.max(...queries.map((q) => q.id), 0) + 1
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'CLEAR_TOAST':
      return { ...state, toast: null }

    case 'RESET':
      return {
        queries: structuredClone(initialQueries),
        wallet: { ...initialWallet },
        toast: 'Reset to starting state',
      }

    case 'TICK': {
      const queries = state.queries.map((q) =>
        q.isResolved
          ? q
          : {
              ...q,
              timeRemainingMs: Math.max(0, q.timeRemainingMs - action.ms),
            },
      )
      return { ...state, queries }
    }

    case 'CLAIM': {
      const q = state.queries.find((x) => x.id === action.queryId)
      if (!q || q.claimableAmount <= 0) return state
      const amount = q.claimableAmount
      return {
        ...state,
        wallet: {
          ...state.wallet,
          repBalance: state.wallet.repBalance + amount,
        },
        queries: state.queries.map((x) =>
          x.id === action.queryId
            ? { ...x, claimableAmount: 0, category: 'expired_hidden' as const }
            : x,
        ),
        toast: `Claimed ${formatRep(amount)} REP winnings`,
      }
    }

    case 'MIGRATE': {
      const q = state.queries.find((x) => x.id === action.queryId)
      if (!q?.forkInfo) return state
      const amount = action.amount
      if (amount <= 0) return state
      if (state.wallet.repBalance < amount) {
        return { ...state, toast: 'Insufficient REP to migrate' }
      }
      // Migration only deducts REP — the query stays in the list unchanged so
      // the user can keep interacting with the fork UX.
      return {
        ...state,
        wallet: {
          ...state.wallet,
          repBalance: state.wallet.repBalance - amount,
        },
        toast: `Migrated ${formatRep(amount)} REP to ${action.childLabel}`,
      }
    }

    case 'ADD_REP':
      return {
        ...state,
        wallet: {
          ...state.wallet,
          repBalance: state.wallet.repBalance + action.amount,
        },
        toast: `Added ${formatRep(action.amount)} REP to wallet`,
      }

    case 'SKIP_TIME': {
      const queries = state.queries.map((q) =>
        q.isResolved
          ? q
          : {
              ...q,
              timeRemainingMs: Math.max(0, q.timeRemainingMs - action.ms),
            },
      )
      return {
        ...state,
        queries,
        toast: 'Skipped forward 2 hours',
      }
    }

    case 'STAKE': {
      const q = state.queries.find((x) => x.id === action.queryId)
      if (!q) return state
      const amount = action.amount
      if (amount <= 0) return state
      if (state.wallet.repBalance < amount) {
        return { ...state, toast: 'Insufficient REP balance' }
      }

      const totalStakedByOutcome = [...q.totalStakedByOutcome]
      while (totalStakedByOutcome.length < q.outcomes.length) {
        totalStakedByOutcome.push(0)
      }
      totalStakedByOutcome[action.outcomeIndex] =
        (totalStakedByOutcome[action.outcomeIndex] ?? 0) + amount

      const newStake = {
        id: `${q.id}-${q.stakes.length}`,
        owner: MOCK_USER_ADDRESS,
        isUser: true,
        outcomeIndex: action.outcomeIndex,
        amount,
        timestamp: Date.now(),
      }

      const nextBond = Math.min(amount * 2, FORK_BOND_REP)
      const wasUrgent = q.userHasLosingBond

      const updated: MockQuery = {
        ...q,
        stakes: [...q.stakes, newStake],
        totalStakedByOutcome,
        tentativeOutcome: action.outcomeIndex,
        appealBond: nextBond,
        hasOpenAppeal: false,
        columnMode: 'preAppeal',
        userHasLosingBond: false,
        timeRemainingMs: 24 * 60 * 60 * 1000,
        category: wasUrgent ? 'appeal_window' : q.category,
      }

      if (nextBond >= FORK_BOND_REP) {
        updated.forkInfo = {
          forkState: 1,
          childUniverses: q.outcomes.map((label, outcomeIndex) => ({
            outcomeIndex,
            label,
          })),
          migrateAmount: Math.min(state.wallet.repBalance - amount, 2000),
          selectedChild: action.outcomeIndex,
        }
        updated.category = 'required_fork_migrate'
        updated.columnMode = 'activeAppeal'
      }

      return {
        ...state,
        wallet: {
          ...state.wallet,
          repBalance: state.wallet.repBalance - amount,
        },
        queries: state.queries.map((x) =>
          x.id === action.queryId ? updated : x,
        ),
        toast: `Staked ${formatRep(amount)} REP on ${q.outcomes[action.outcomeIndex]}`,
      }
    }

    case 'CREATE_QUERY': {
      const id = nextId(state.queries)
      const fee = action.fee
      const totalCost = fee + (action.tip ?? 0)
      if (state.wallet.repBalance < totalCost) {
        return { ...state, toast: 'Insufficient REP for query fee' }
      }
      const newQuery: MockQuery = {
        id,
        question: action.question,
        outcomes: action.outcomes,
        fee,
        createdAt: Date.now(),
        appealBond: fee,
        tentativeOutcome: action.outcomes.length - 1,
        finalOutcome: null,
        totalStakedByOutcome: action.outcomes.map(() => 0),
        stakes: [],
        timeRemainingMs: 3 * 24 * 60 * 60 * 1000,
        columnMode: 'activeAppeal',
        category: 'awaiting_first_report',
        isResolved: false,
        claimableAmount: 0,
        userHasLosingBond: false,
        hasOpenAppeal: false,
        tip: action.tip,
      }
      return {
        ...state,
        wallet: {
          ...state.wallet,
          repBalance: state.wallet.repBalance - totalCost,
        },
        queries: [newQuery, ...state.queries],
        toast: `Created query #${id} for ${formatRep(totalCost)} REP`,
      }
    }

    default:
      return state
  }
}

export function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    maximumFractionDigits: n < 10 ? 2 : 0,
  })
}

export function formatRep(n: number): string {
  // Precision scales with magnitude: >100 whole, 10–100 one decimal,
  // 1–10 two decimals, <1 three decimals.
  const abs = Math.abs(n)
  let digits: number
  if (abs >= 100) digits = 0
  else if (abs >= 10) digits = 1
  else if (abs >= 1) digits = 2
  else digits = 3
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })
}

export function truncateAddress(addr: string): string {
  if (addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
