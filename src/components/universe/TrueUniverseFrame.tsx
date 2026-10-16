import { useEffect, useMemo, useState } from 'react'
import { forkBondRep, type UniverseNode } from '../../data/universes'
import { formatInformationCutoff, formatRep } from '../../lib/actions'
import {
  INVALID_OUTCOME_HEX,
  formatOutcomeIdLabel,
} from '../../lib/outcomeId'
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
                onBack={() => {
                  const parentId = universes[step.universeId]?.parentId
                  if (parentId == null) {
                    setStep({ kind: 'fork', universeId: 0 })
                    return
                  }
                  setStep({ kind: 'fork', universeId: parentId })
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

type OutcomeChoice = {
  label: string
  outcomeId: string
  childId?: number
}

/** True when the custom field takes a human answer and converts to a whole outcome id. */
function usesDecimalAnswerInput(
  kind: 'categorical' | 'scalar' | 'rawIds',
  decimals: number,
): boolean {
  return kind === 'scalar' || decimals > 0
}

/**
 * Parse custom input into a choice button.
 * Scalar / decimals>0: enter the decimal answer → outcomeId = answer × 10^decimals.
 * Otherwise: enter the raw outcome id.
 */
function parseCustomChoice(
  input: string,
  kind: 'categorical' | 'scalar' | 'rawIds',
  decimals: number,
): OutcomeChoice | null {
  const raw = input.trim()
  if (!raw) return null
  if (
    /^F{16,}$/i.test(raw) ||
    raw.toLowerCase() === 'invalid'
  ) {
    return { label: INVALID_OUTCOME, outcomeId: INVALID_OUTCOME_HEX }
  }
  if (usesDecimalAnswerInput(kind, decimals)) {
    const answer = Number(raw)
    if (!Number.isFinite(answer) || answer < 0) return null
    const outcomeId = String(Math.round(answer * 10 ** decimals))
    return {
      label: (Number(outcomeId) / 10 ** decimals).toFixed(decimals),
      outcomeId,
    }
  }
  return { label: raw, outcomeId: raw }
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
  // Scalar forks omit outcomes= encoding — show price buttons + Invalid + free id.
  const isScalarNoEncoding =
    fork?.kind === 'scalar' && !fork.queryText.includes('[')
  const showRawIds = fork?.kind === 'rawIds' || isScalarNoEncoding

  const [extraChoices, setExtraChoices] = useState<OutcomeChoice[]>([])

  useEffect(() => {
    setExtraChoices([])
  }, [universe.id])

  const buttons = useMemo(() => {
    if (!fork) return []
    const mapped: OutcomeChoice[] = fork.outcomes.map((o) => ({
      label: o.label,
      outcomeId: o.outcomeId,
      childId: o.childUniverseId,
    }))
    const hasInvalid = mapped.some(
      (b) => b.label === INVALID_OUTCOME || b.outcomeId === INVALID_OUTCOME_HEX,
    )
    if (showRawIds && !hasInvalid) {
      mapped.push({
        label: INVALID_OUTCOME,
        outcomeId: INVALID_OUTCOME_HEX,
        childId: undefined,
      })
    }
    for (const extra of extraChoices) {
      if (mapped.some((b) => b.outcomeId === extra.outcomeId)) continue
      mapped.push(extra)
    }
    return mapped
  }, [fork, showRawIds, extraChoices])

  if (!fork) {
    return <p className="text-sm text-gray-600">No fork query on this universe.</p>
  }

  const decimals = fork.decimals ?? 0
  const decimalAnswerInput = usesDecimalAnswerInput(fork.kind, decimals)

  const addCustomChoice = () => {
    const choice = parseCustomChoice(customId, fork.kind, decimals)
    if (!choice) return
    if (buttons.some((b) => b.outcomeId === choice.outcomeId)) {
      onCustomId('')
      return
    }
    setExtraChoices((prev) => [...prev, choice])
    onCustomId('')
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
        <p className="mt-2 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Information cutoff:</span>{' '}
          {formatInformationCutoff(fork.informationCutoff)}
        </p>
        {fork.kind === 'scalar' || fork.decimals != null ? (
          <p className="mt-1 text-xs text-gray-500">
            scalar · decimals={decimals} · answer = outcomeId / 10^
            {decimals}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {buttons.map((b) => (
          <button
            key={`${b.label}-${b.outcomeId}`}
            type="button"
            onClick={() => onSelect(b.label, b.childId)}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:border-gray-400 hover:bg-gray-50"
          >
            {b.label}
            <span className="ml-2 font-mono text-xs font-normal text-gray-400">
              {formatOutcomeIdLabel(b.outcomeId)}
            </span>
          </button>
        ))}

        {(fork.allowCustomOutcome || showRawIds) && (
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={customId}
              onChange={(e) => onCustomId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomChoice()
                }
              }}
              placeholder={decimalAnswerInput ? 'Answer…' : 'Outcome id…'}
              className="min-w-0 flex-1 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
            />
            <button
              type="button"
              disabled={!customId.trim()}
              onClick={addCustomChoice}
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
  onAffirm,
  onFork,
  onBack,
}: {
  universe: UniverseNode
  onAffirm: () => void
  onFork: () => void
  onBack: () => void
}) {
  const bond = forkBondRep(universe.supply)
  const pending = Boolean(universe.pendingFork)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="text-base font-semibold text-gray-900">
          Universe {universe.id}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {formatRep(universe.supply)} <RepToken universeId={universe.id} /> has
          migrated to this universe so far
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
        Fork Universe {universe.id}
        <span className="mt-1 block text-xs font-normal text-gray-500">
          {formatRep(bond)} <RepToken universeId={universe.id} /> (0.4% of
          supply)
        </span>
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Back
        {universe.parentId != null ? (
          <span className="mt-1 block text-xs font-normal text-gray-500">
            Return to Universe {universe.parentId} fork
          </span>
        ) : null}
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
