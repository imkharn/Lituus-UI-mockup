import { useMemo, useState } from 'react'
import { mockStats } from '../../data/mockQueries'
import { formatRep, formatUsd } from '../../lib/actions'
import { BenefitBanner } from '../layout/BenefitBanner'
import { QueryHelp } from './QueryHelp'

interface QueryTabProps {
  walletBalance: number
  onCreate: (
    question: string,
    outcomes: string[],
    fee: number,
    tip?: number,
  ) => void
}

export function QueryTab({ walletBalance, onCreate }: QueryTabProps) {
  const [question, setQuestion] = useState('')
  const [outcomeMode, setOutcomeMode] = useState<'binary' | 'categorical'>(
    'binary',
  )
  const [outcomeLabels, setOutcomeLabels] = useState('Apple, Banana, Carrot')
  const [tipAmount, setTipAmount] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const repPrice = mockStats.repPriceUsd
  const protocolFeeUsd = mockStats.protocolFeeUsd
  const ammPriceUsd = mockStats.ammPriceUsd
  const protocolFeeRep = protocolFeeUsd / repPrice
  const ammPriceRep = ammPriceUsd / repPrice
  const bestPriceUsd = Math.min(protocolFeeUsd, ammPriceUsd)
  const bestSource = ammPriceUsd <= protocolFeeUsd ? 'AMM' : 'Protocol'
  const feeRep = bestPriceUsd / repPrice
  const tipNum = Number(tipAmount) > 0 ? Number(tipAmount) : 0
  const totalRep = feeRep + tipNum

  const outcomes = useMemo(() => {
    if (outcomeMode === 'binary') return ['No', 'Yes', 'Invalid']
    const parts = outcomeLabels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length < 2) return ['A', 'B', 'Invalid']
    return [...parts, 'Invalid']
  }, [outcomeMode, outcomeLabels])

  const outcomePreview =
    outcomeMode === 'binary'
      ? outcomes.join(' · ')
      : outcomes
          .map((o, i) => {
            const hex =
              i === outcomes.length - 1
                ? 'FF'
                : i.toString(16).padStart(2, '0').toUpperCase()
            return `outcome ${hex} = ${o}`
          })
          .join(', ')

  const oiExceedsAttack =
    mockStats.estimatedOpenInterest != null &&
    mockStats.estimatedOpenInterest > mockStats.attackCostUsd

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    if (oiExceedsAttack) return
    if (walletBalance < totalRep) return

    const tip = tipNum > 0 ? tipNum : undefined

    const suffix =
      outcomeMode === 'binary'
        ? ' [0=false,1=true]'
        : ` [${outcomes
            .slice(0, -1)
            .map(
              (o, i) =>
                `${i.toString(16).padStart(2, '0').toUpperCase()}=${o}`,
            )
            .join(',')},FF=Invalid]`

    onCreate(question.trim() + suffix, outcomes, feeRep, tip)
    setSubmitted(true)
    setQuestion('')
    setTipAmount('')
  }

  return (
    <div>
      <BenefitBanner
        variant="query"
        benefits={[
          {
            text: `Create queries backed by $${(mockStats.attackCostUsd / 1e6).toFixed(1)}M attack cost`,
            emphasis: `$${(mockStats.attackCostUsd / 1e6).toFixed(1)}M`,
          },
          {
            text: 'Resolve truth with zero multisig overrides',
            emphasis: 'zero',
          },
          {
            text: 'Answer any question without trusting any authority in as little as 1 day',
            emphasis: '1 day',
          },
        ]}
        onLearnMore={() => setHelpOpen(true)}
      />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900">Create a query</h2>

        {oiExceedsAttack && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <strong>Not safe to create a query.</strong> Estimated open interest
            exceeds the attack cost (${mockStats.attackCostUsd.toLocaleString()}
            ). See Stats for details.
          </div>
        )}

        {submitted && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Query created successfully. Switch to the Report tab to see it
            awaiting its first report.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => {
                setSubmitted(false)
                setQuestion(e.target.value)
              }}
              rows={3}
              placeholder="Will the Fed cut rates at the next FOMC meeting?"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Outcomes
            </label>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setOutcomeMode('binary')}
                className={
                  outcomeMode === 'binary'
                    ? 'rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white'
                    : 'rounded-md border border-border px-3 py-1.5 text-sm text-gray-700'
                }
              >
                Yes / No
              </button>
              <button
                type="button"
                onClick={() => setOutcomeMode('categorical')}
                className={
                  outcomeMode === 'categorical'
                    ? 'rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white'
                    : 'rounded-md border border-border px-3 py-1.5 text-sm text-gray-700'
                }
              >
                Categorical
              </button>
            </div>
            {outcomeMode === 'categorical' && (
              <input
                type="text"
                value={outcomeLabels}
                onChange={(e) => setOutcomeLabels(e.target.value)}
                placeholder="Comma-separated outcomes"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            )}
            <p className="mt-1.5 text-xs text-gray-500">
              Outcomes: {outcomePreview}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tip amount (optional)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="any"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border px-3 py-2 pr-12 text-sm focus:border-gray-400 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-300">
                REP
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Paid to the first correct reporter.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Protocol fee</span>
              <span className="text-right">
                <span className="text-sm text-gray-900">
                  {formatRep(protocolFeeRep)} REP
                </span>{' '}
                <span className="text-xs text-gray-400">
                  ${formatUsd(protocolFeeUsd)}
                </span>
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-gray-600">AMM price</span>
              <span className="text-right">
                <span className="text-sm text-gray-900">
                  {formatRep(ammPriceRep)} REP
                </span>{' '}
                <span className="text-xs text-gray-400">
                  ${formatUsd(ammPriceUsd)}
                </span>
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-medium text-gray-900">
                Best price
              </span>
              <span className="inline-flex items-baseline gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {bestSource}
                </span>
                <span className="text-base font-semibold text-gray-900">
                  {formatRep(feeRep)} REP
                </span>
                <span className="text-xs text-gray-400">
                  ≈ ${formatUsd(bestPriceUsd)}
                </span>
              </span>
            </div>
            {tipNum > 0 && (
              <>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tip</span>
                  <span className="text-right">
                    <span className="text-sm text-gray-900">
                      +{formatRep(tipNum)} REP
                    </span>{' '}
                    <span className="text-xs text-gray-400">
                      ${formatUsd(tipNum * repPrice)}
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-sm font-medium text-gray-900">
                    Total
                  </span>
                  <span className="inline-flex items-baseline gap-2">
                    <span className="text-base font-semibold text-gray-900">
                      {formatRep(totalRep)} REP
                    </span>
                    <span className="text-xs text-gray-400">
                      ≈ ${formatUsd(totalRep * repPrice)}
                    </span>
                  </span>
                </div>
              </>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Your wallet: {formatRep(walletBalance)} REP
            </p>
          </div>

          <button
            type="submit"
            disabled={
              !question.trim() || oiExceedsAttack || walletBalance < totalRep
            }
            className="w-full rounded-lg bg-augur-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-augur-green-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create query for {formatRep(totalRep)} REP
          </button>
        </form>

        <div className="mt-8">
          <QueryHelp
            open={helpOpen}
            onToggle={() => setHelpOpen((o) => !o)}
            attackCost={mockStats.attackCostUsd}
            openInterest={mockStats.estimatedOpenInterest}
          />
        </div>
      </div>
    </div>
  )
}
