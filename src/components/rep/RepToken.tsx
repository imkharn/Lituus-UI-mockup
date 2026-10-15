import type { ReactNode } from 'react'
import { useUniverse } from '../../context/UniverseContext'

interface RepTokenProps {
  /** Optional className for the wrapping span. */
  className?: string
  /** Override universe id (defaults to current). */
  universeId?: number
}

/** Renders REP with the current universe id as a tiny superscript. */
export function RepToken({ className, universeId }: RepTokenProps) {
  const { universeId: current } = useUniverse()
  const id = universeId ?? current
  return (
    <span className={className}>
      REP
      <sup className="ml-px text-[0.65em] font-semibold leading-none">{id}</sup>
    </span>
  )
}

/** Plain-text REP^n for toasts and attributes. */
export function repText(universeId: number): string {
  return `REP^${universeId}`
}

interface RepAmountProps {
  amount: ReactNode
  className?: string
  universeId?: number
}

/** Convenience: "{amount} REPⁿ" */
export function RepAmount({ amount, className, universeId }: RepAmountProps) {
  return (
    <span className={className}>
      {amount} <RepToken universeId={universeId} />
    </span>
  )
}
