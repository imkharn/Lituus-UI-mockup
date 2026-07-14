import { useMemo, useState } from 'react'
import { mockStats } from '../../data/mockQueries'
import { formatRep } from '../../lib/actions'
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

  const protocolFee = mockStats.protocolFeeUsd
  const ammPrice = mockStats.ammPriceUsd
  const bestPriceUsd = Math.min(protocolFee, ammPrice)
  const bestSource = ammPrice <= protocolFee ? 'AMM' : 'Protocol'
  const feeRep = bestPriceUsd / mockStats.repPriceUsd

  const outcomes = useMemo(() => {
    if (outcomeMode === 'binary') return ['No', 'Yes', 'Invalid']
    const parts = outcomeLabels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length < 2) return ['A', 'B', 'Invalid']
    return [...parts, 'Invalid']
  }, [outcomeMode, outcomeLabels])

  const oiExceedsAttack =
    mockStats.estimatedOpenInterest != null &&
    mockStats.estimatedOpenInterest > mockStats.attackCostUsd

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    if (oiExceedsAttack) return
    if (walletBalance < feeRep) return

    const tip = Number(tipAmount) > 0 ? Number(tipAmount) : undefined

    const suffix =
      outcomeMode === 'binary'
        ? ' [0=false,1=true]'
        : ` [${outcomes
            .slice(0, -1)
            .map((o, i) => `${i}=${o}`)
            .join(',')}]`

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
              Outcomes: {outcomes.join(' · ')} (Invalid always included)
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tip amount (optional)
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Denominated in REP — paid to the first correct reporter.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Protocol fee</span>
              <span className="text-sm text-gray-900">${protocolFee}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-gray-600">AMM price</span>
              <span className="text-sm text-gray-900">${ammPrice}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-medium text-gray-900">
                Best price
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {bestSource}
                </span>
                <span className="text-base font-semibold text-gray-900">
                  ${bestPriceUsd}
                </span>
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              ≈ {formatRep(feeRep)} REP · Your wallet:{' '}
              {formatRep(walletBalance)} REP
            </p>
          </div>

          <button
            type="submit"
            disabled={
              !question.trim() || oiExceedsAttack || walletBalance < feeRep
            }
            className="w-full rounded-lg bg-augur-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-augur-green-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create query for ${bestPriceUsd}
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
