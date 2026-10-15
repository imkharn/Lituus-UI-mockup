import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  TRUE_UNIVERSE_ID,
  forkBondRep,
  hasForked,
  initialUniverses,
  nextUniverseId,
  type ForkQueryKind,
  type UniverseNode,
} from '../data/universes'

interface UniverseContextValue {
  universeId: number
  universes: Record<number, UniverseNode>
  current: UniverseNode
  /** True when the current universe has forked — report list should be empty. */
  reportListEmpty: boolean
  setUniverseId: (id: number) => void
  markPendingFork: (
    id: number,
    pending: {
      question: string
      outcomes: string[]
      kind: ForkQueryKind
      decimals?: number
    },
  ) => void
  /** Create a brand-new child universe under parent (e.g. Invalid / custom). */
  createChildUniverse: (parentId: number, label: string) => number
  forkBondFor: (id: number) => number
}

const UniverseContext = createContext<UniverseContextValue | null>(null)

export function UniverseProvider({ children }: { children: ReactNode }) {
  const [universeId, setUniverseId] = useState(TRUE_UNIVERSE_ID)
  const [universes, setUniverses] =
    useState<Record<number, UniverseNode>>(initialUniverses)

  const value = useMemo<UniverseContextValue>(() => {
    const current = universes[universeId] ?? universes[TRUE_UNIVERSE_ID]

    return {
      universeId,
      universes,
      current,
      reportListEmpty: hasForked(current),
      setUniverseId,
      markPendingFork: (id, pending) => {
        setUniverses((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            pendingFork: pending,
            // Soft-fork: no children / no new ids yet.
            forkQuery: prev[id].forkQuery,
          },
        }))
      },
      createChildUniverse: (parentId, _label) => {
        const id = nextUniverseId(universes)
        const parent = universes[parentId]
        // New branches get a tiny residual share for the mock (1% of parent).
        const supply = Math.round(parent.supply * 0.01)
        setUniverses((prev) => ({
          ...prev,
          [parentId]: {
            ...prev[parentId],
            childIds: [...prev[parentId].childIds, id],
          },
          [id]: {
            id,
            parentId,
            supply,
            childIds: [],
          },
        }))
        return id
      },
      forkBondFor: (id) => forkBondRep(universes[id]?.supply ?? 0),
    }
  }, [universeId, universes])

  return (
    <UniverseContext.Provider value={value}>{children}</UniverseContext.Provider>
  )
}

export function useUniverse(): UniverseContextValue {
  const ctx = useContext(UniverseContext)
  if (!ctx) {
    throw new Error('useUniverse must be used within UniverseProvider')
  }
  return ctx
}
