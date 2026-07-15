import { useEffect, useReducer, useCallback } from 'react'
import { initialQueries, initialWallet } from '../data/mockQueries'
import { appReducer, type AppState } from '../lib/actions'

const initialState: AppState = {
  queries: initialQueries,
  wallet: initialWallet,
  toast: null,
}

export function useQueries() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    const id = window.setInterval(() => {
      dispatch({ type: 'TICK', ms: 60_000 })
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!state.toast) return
    const id = window.setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500)
    return () => window.clearTimeout(id)
  }, [state.toast])

  const stake = useCallback(
    (queryId: number, outcomeIndex: number, amount: number) => {
      dispatch({ type: 'STAKE', queryId, outcomeIndex, amount })
    },
    [],
  )

  const claim = useCallback((queryId: number) => {
    dispatch({ type: 'CLAIM', queryId })
  }, [])

  const migrate = useCallback(
    (queryId: number, childLabel: string, amount: number) => {
      dispatch({ type: 'MIGRATE', queryId, childLabel, amount })
    },
    [],
  )

  const createQuery = useCallback(
    (question: string, outcomes: string[], fee: number, tip?: number) => {
      dispatch({ type: 'CREATE_QUERY', question, outcomes, fee, tip })
    },
    [],
  )

  return {
    queries: state.queries,
    wallet: state.wallet,
    toast: state.toast,
    stake,
    claim,
    migrate,
    createQuery,
    clearToast: () => dispatch({ type: 'CLEAR_TOAST' }),
  }
}
