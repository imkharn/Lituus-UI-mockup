import { useMemo, useState } from 'react'
import type { MockQuery } from '../../types/query'
import { currentReporterPay, estimateToWin } from '../../lib/profit'
import { mockStats } from '../../data/mockQueries'
import { formatRep, formatUsd } from '../../lib/actions'

interface StakeFormProps {
  query: MockQuery
  walletBalance: number
  onStake: (outcomeIndex: number, amount: number) => void
  onClaim: () => void
  onMigrate: (childOutcome: number) => void
}

export function StakeForm({
  query,
  walletBalance,
  onStake,
  onClaim,
  onMigrate,
}: StakeFormProps) {
  const isClaim = query.isResolved && query.claimableAmount > 0
  const isMigrate = Boolean(query.forkInfo)
  const invalidIndex = query.outcomes.length - 1
  const defaultOutcome =
    query.tentativeOutcome !== null && query.tentativeOutcome !== invalidIndex
      ? query.outcomes.findIndex((_, i) => i !== query.tentativeOutcome)
      : 0
  const [outcomeIndex, setOutcomeIndex] = useState(
    defaultOutcome >= 0 ? defaultOutcome : 0,
  )
  const [bet, setBet] = useState<string>('')
  const [touched, setTouched] = useState(false)
  const [childOutcome, setChildOutcome] = useState(
    query.forkInfo?.selectedChild ?? 0,
  )

  const repPrice = mockStats.repPriceUsd
  const betNum = Number(bet) || 0
  const toWin = useMemo(
    () => estimateToWin(betNum, query, outcomeIndex),
    [betNum, query, outcomeIndex],
  )

  const requiredBond = query.appealBond || query.fee
  const maxStake = Math.min(requiredBond, walletBalance)

  if (isClaim) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-900">
            You have{' '}
            <strong>{formatRep(query.claimableAmount)} REP</strong> (≈ $
            {formatUsd(query.claimableAmount * repPrice)}) in winning stakes
            ready to claim.
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Final outcome: {query.outcomes[query.finalOutcome ?? 0]}
          </p>
        </div>
        <button
          type="button"
          onClick={onClaim}
          className="w-full rounded-lg bg-augur-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-augur-green-dark"
        >
          Claim {formatRep(query.claimableAmount)} REP
        </button>
      </div>
    )
  }

  if (isMigrate && query.forkInfo) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Migrate to a fork
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Fork state {query.forkInfo.forkState}: choose the child universe
            that matches the correct outcome. Same escalation UX — your REP
            moves to that universe.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Child universe
          </label>
          <div className="flex flex-wrap gap-2">
            {query.forkInfo.childUniverses.map((c) => (
              <button
                key={c.outcomeIndex}
                type="button"
                onClick={() => setChildOutcome(c.outcomeIndex)}
                className={
                  childOutcome === c.outcomeIndex
                    ? 'rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm text-white'
                    : 'rounded-md border border-border bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50'
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Migrate amount</span>
          <span className="font-medium text-gray-900">
            {formatRep(query.forkInfo.migrateAmount)} REP (≈ $
            {formatUsd(query.forkInfo.migrateAmount * repPrice)})
          </span>
        </div>
        <button
          type="button"
          onClick={() => onMigrate(childOutcome)}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Migrate REP
        </button>
        <InfoBlock query={query} />
      </div>
    )
  }

  const cta = query.stakes.length === 0 ? 'Report' : 'Appeal'

  return (
    <div className="space-y-4">
      {query.userHasLosingBond && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          Bond will be lost if you don&apos;t appeal before the timer expires.
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          Outcome
        </label>
        <div className="flex flex-wrap gap-2">
          {query.outcomes.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setOutcomeIndex(i)}
              className={
                outcomeIndex === i
                  ? 'rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm text-white'
                  : 'rounded-md border border-border bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50'
              }
            >
              {label}
              {query.tentativeOutcome === i ? ' (tentative)' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Bet (REP)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step="any"
              value={bet}
              placeholder={!touched ? formatRep(requiredBond) : undefined}
              onChange={(e) => {
                setTouched(true)
                setBet(e.target.value)
              }}
              onFocus={() => setTouched(true)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setTouched(true)
                setBet(String(maxStake))
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-semibold text-augur-green hover:bg-emerald-50"
            >
              MAX
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {betNum > 0 ? `≈ $${formatUsd(betNum * repPrice)}` : '\u00a0'}
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            To win (REP)
          </label>
          <input
            type="text"
            readOnly
            value={betNum > 0 ? formatRep(toWin) : ''}
            placeholder="—"
            className="w-full rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300"
          />
          <p className="mt-1 text-xs text-gray-400">
            {betNum > 0 ? `≈ $${formatUsd(toWin * repPrice)}` : '\u00a0'}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Max stakes the lesser of the{' '}
        {query.stakes.length === 0 ? 'reporting bond' : 'appeal bond'} (
        {formatRep(requiredBond)} REP) or your wallet (
        {formatRep(walletBalance)} REP).
        {query.tip != null && query.tip > 0 && (
          <>
            {' '}
            Tip: {formatRep(query.tip)} REP — paid to the first correct
            reporter along with reporter pay.
          </>
        )}
      </p>

      <button
        type="button"
        disabled={betNum <= 0 || betNum > walletBalance}
        onClick={() => onStake(outcomeIndex, betNum)}
        className="w-full rounded-lg bg-augur-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-augur-green-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {cta} — bet {betNum > 0 ? formatRep(betNum) : '…'} REP to win{' '}
        {betNum > 0 ? formatRep(toWin) : '…'} REP
      </button>

      <InfoBlock query={query} />
    </div>
  )
}

function InfoBlock({ query }: { query: MockQuery }) {
  const pay = currentReporterPay(query)
  return (
    <div className="space-y-2 rounded-lg border border-border bg-gray-50 p-3 text-xs text-gray-600">
      <p>
        <span className="font-medium text-gray-800">Query data:</span>{' '}
        {query.question}
      </p>
      <p>
        Fee {formatRep(query.fee)} REP · Reporter pay ~{formatRep(pay)} REP
        {query.tip != null && query.tip > 0 && (
          <> · Tip {formatRep(query.tip)} REP</>
        )}
      </p>
      <p>
        Invalid is always an outcome. Questions outside the{' '}
        <a
          href="#reporting-guide"
          className="font-medium text-gray-900 underline underline-offset-2"
        >
          reporting guide
        </a>{' '}
        (ambiguous timing, subjective criteria) should resolve Invalid.
      </p>
    </div>
  )
}
