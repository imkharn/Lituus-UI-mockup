import { useEffect, useMemo, useState } from 'react'
import { forkBondRep, type UniverseNode } from '../../data/universes'
import { formatRep } from '../../lib/actions'
import { RepToken } from '../rep/RepToken'

interface TrueUniverseFrameProps {
  open: boolean
  universes: Record<number, UniverseNode>
  walletBalance: number
  onClose: () => void
  onAffirm: (universeId: number) => void
  onCreateChild: (parentId: number, label: string) => number
  onMarkPendingFork: (
    id: number,
    pending: {
      question: string
      outcomes: string[]
      kind: 'categorical' | 'scalar' | 'rawIds'
      decimals?: number
    },
  ) => void
  onToast: (message: string) => void
}

type Step =
  | { kind: 'fork'; universeId: number }
  | { kind: 'leaf'; universeId: number }
  | { kind: 'createFork'; universeId: number }

const INVALID_OUTCOME = 'Invalid'

export function TrueUniverseFrame({
  open,
  universes,
  walletBalance,
  onClose,
  onAffirm,
  onCreateChild,
  onMarkPendingFork,
  onToast,
}: TrueUniverseFrameProps) {
  const [step, setStep] = useState<Step>({ kind: 'fork', universeId: 0 })
  const [customId, setCustomId] = useState('')
  const [forkQuestion, setForkQuestion] = useState('')
  const [forkKind, setForkKind] = useState<'categorical' | 'scalar'>('categorical')
  const [forkOutcomes, setForkOutcomes] = useState('Yes, No')
  const [forkDecimals, setForkDecimals] = useState('0')

  useEffect(() => {
    if (open) {
      setStep({ kind: 'fork', universeId: 0 })
      setCustomId('')
    }
  }, [open])

  if (!open) return null

  const goToUniverseStep = (id: number) => {
    const u = universes[id]
    if (!u) {
      onToast(`Universe ${id} does not exist yet`)
      return
    }
    // Continue down the tree only when children already exist.
    if (u.forkQuery && u.childIds.length > 0) {
      setStep({ kind: 'fork', universeId: id })
    } else {
      setStep({ kind: 'leaf', universeId: id })
    }
  }

  const selectOutcome = (
    parentId: number,
    outcomeLabel: string,
    childId?: number,
  ) => {
    if (childId != null && universes[childId]) {
      goToUniverseStep(childId)
      return
    }
    // Invalid / custom / unmapped → mint the next sequential universe id.
    const newId = onCreateChild(parentId, outcomeLabel)
    onToast(
      `Created Universe ${newId} from "${outcomeLabel}" (token REP^${newId})`,
    )
    setStep({ kind: 'leaf', universeId: newId })
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      role="presentation"
    >
      {/* Fake browser chrome around an "iframe" */}
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-[#1a1d23] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-gray-700 bg-[#252830] px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="ml-2 flex-1 truncate rounded-md bg-[#0f1115] px-3 py-1 font-mono text-[11px] text-gray-400">
            https://true.augur.net/forks/genesis
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f5f7] text-gray-900">
          <div className="border-b border-gray-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              True-universe resolver · external frame
            </p>
            <h2 className="text-sm font-semibold text-gray-900">
              Walk forks to the True universe
            </h2>
          </div>

          <div className="p-4">
            {step.kind === 'fork' && (
              <ForkStep
                universe={universes[step.universeId]}
                customId={customId}
                onCustomId={setCustomId}
                onSelect={(label, childId) =>
                  selectOutcome(step.universeId, label, childId)
                }
              />
            )}

            {step.kind === 'leaf' && (
              <LeafStep
                universe={universes[step.universeId]}
                walletBalance={walletBalance}
                onAffirm={() => {
                  onAffirm(step.universeId)
                  onClose()
                }}
                onFork={() => {
                  const bond = forkBondRep(universes[step.universeId].supply)
                  if (walletBalance < bond) {
                    onToast(
                      `Insufficient REP^${step.universeId} to fork`,
                    )
                    return
                  }
                  setForkQuestion('')
                  setForkOutcomes('Yes, No')
                  setForkKind('categorical')
                  setForkDecimals('0')
                  setStep({ kind: 'createFork', universeId: step.universeId })
                }}
              />
            )}

            {step.kind === 'createFork' && (
              <CreateForkStep
                universeId={step.universeId}
                question={forkQuestion}
                outcomes={forkOutcomes}
                kind={forkKind}
                decimals={forkDecimals}
                bond={forkBondRep(universes[step.universeId].supply)}
                onQuestion={setForkQuestion}
                onOutcomes={setForkOutcomes}
                onKind={setForkKind}
                onDecimals={setForkDecimals}
                onCancel={() => setStep({ kind: 'leaf', universeId: step.universeId })}
                onSubmit={() => {
                  const parts = forkOutcomes
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                  const list =
                    forkKind === 'scalar'
                      ? ['Number', 'Invalid']
                      : [...parts, 'Invalid']
                  if (forkKind === 'categorical' && parts.length < 2) {
                    onToast('Enter at least two outcomes')
                    return
                  }
                  if (!forkQuestion.trim()) {
                    onToast('Enter a fork query')
                    return
                  }
                  onMarkPendingFork(step.universeId, {
                    question: forkQuestion.trim(),
                    outcomes: list,
                    kind: forkKind,
                    decimals:
                      forkKind === 'scalar'
                        ? Number(forkDecimals) || 0
                        : undefined,
                  })
                  onToast(
                    `Universe ${step.universeId} marked forked (no children yet)`,
                  )
                  setStep({ kind: 'leaf', universeId: step.universeId })
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ForkStep({
  universe,
  customId,
  onCustomId,
  onSelect,
}: {
  universe: UniverseNode
  customId: string
  onCustomId: (v: string) => void
  onSelect: (label: string, childId?: number) => void
}) {
  const fork = universe.forkQuery
  // rawIds kind, or scalar forks that omit outcomes= encoding, use numeric buttons.
  const showRawIds =
    fork?.kind === 'rawIds' ||
    (fork?.kind === 'scalar' && !fork.queryText.includes('['))
  const buttons = useMemo(() => {
    if (!fork) return []
    if (showRawIds) {
      return [
        ...fork.outcomes.map((o) => ({
          label: o.label,
          childId: o.childUniverseId,
        })),
        { label: INVALID_OUTCOME, childId: undefined as number | undefined },
      ]
    }
    return fork.outcomes.map((o) => ({
      label: o.label,
      childId: o.childUniverseId,
    }))
  }, [fork, showRawIds])

  if (!fork) {
    return <p className="text-sm text-gray-600">No fork query on this universe.</p>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Universe {universe.id} fork
        </p>
        <h3 className="mt-1 text-base font-semibold text-gray-900">
          {fork.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          {fork.queryText}
        </p>
        {fork.kind === 'scalar' || fork.decimals != null ? (
          <p className="mt-2 text-xs text-gray-500">
            Scalar · decimals = {fork.decimals ?? 0} (divide reported value by
            10^{fork.decimals ?? 0})
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500">
          Choose the outcome you believe is True
        </p>
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => onSelect(b.label, b.childId)}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:border-gray-400 hover:bg-gray-50"
          >
            {b.label}
            {b.childId != null && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                → Universe {b.childId}
              </span>
            )}
          </button>
        ))}

        {(fork.allowCustomOutcome || showRawIds) && (
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={customId}
              onChange={(e) => onCustomId(e.target.value)}
              placeholder="Outcome id…"
              className="min-w-0 flex-1 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
            />
            <button
              type="button"
              disabled={!customId.trim()}
              onClick={() => onSelect(customId.trim())}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
            >
              Use
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function LeafStep({
  universe,
  walletBalance,
  onAffirm,
  onFork,
}: {
  universe: UniverseNode
  walletBalance: number
  onAffirm: () => void
  onFork: () => void
}) {
  const bond = forkBondRep(universe.supply)
  const pending = Boolean(universe.pendingFork)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Leaf universe
        </p>
        <h3 className="mt-1 text-base font-semibold text-gray-900">
          Universe {universe.id}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Supply {formatRep(universe.supply)}{' '}
          <RepToken universeId={universe.id} /> · no further child forks
          {pending ? ' · pending fork (no children assigned yet)' : ''}.
        </p>
      </div>

      <button
        type="button"
        onClick={onAffirm}
        className="w-full rounded-xl bg-augur-green px-4 py-3.5 text-left text-sm font-semibold text-white hover:bg-augur-green-dark"
      >
        Affirm Universe {universe.id} as the True Universe
      </button>

      <button
        type="button"
        onClick={onFork}
        className="w-full rounded-xl border border-border bg-white px-4 py-3.5 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50"
      >
        Fork Universe {universe.id} ({formatRep(bond)}{' '}
        <RepToken universeId={universe.id} />)
        <span className="mt-1 block text-xs font-normal text-gray-500">
          Requires 0.4% of supply · wallet {formatRep(walletBalance)}{' '}
          <RepToken universeId={universe.id} />
        </span>
      </button>
    </div>
  )
}

function CreateForkStep({
  universeId,
  question,
  outcomes,
  kind,
  decimals,
  bond,
  onQuestion,
  onOutcomes,
  onKind,
  onDecimals,
  onCancel,
  onSubmit,
}: {
  universeId: number
  question: string
  outcomes: string
  kind: 'categorical' | 'scalar'
  decimals: string
  bond: number
  onQuestion: (v: string) => void
  onOutcomes: (v: string) => void
  onKind: (v: 'categorical' | 'scalar') => void
  onDecimals: (v: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Forking Universe {universeId} costs {formatRep(bond)}{' '}
        <RepToken universeId={universeId} /> (already checked). Children are not
        assigned until this fork is later selected.
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Fork query
        </label>
        <textarea
          value={question}
          onChange={(e) => onQuestion(e.target.value)}
          rows={3}
          placeholder="Will … ?"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onKind('categorical')}
          className={
            kind === 'categorical'
              ? 'rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white'
              : 'rounded-md border border-border px-3 py-1.5 text-sm'
          }
        >
          Categorical
        </button>
        <button
          type="button"
          onClick={() => onKind('scalar')}
          className={
            kind === 'scalar'
              ? 'rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white'
              : 'rounded-md border border-border px-3 py-1.5 text-sm'
          }
        >
          Scalar
        </button>
      </div>

      {kind === 'categorical' ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Outcomes (comma-separated; Invalid always added)
          </label>
          <input
            value={outcomes}
            onChange={(e) => onOutcomes(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Decimals (reported value ÷ 10^decimals)
          </label>
          <input
            type="number"
            min={0}
            value={decimals}
            onChange={(e) => onDecimals(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Fork
        </button>
      </div>
    </div>
  )
}
