import { useState } from 'react'
interface SwitchUniverseModalProps {
  open: boolean
  currentUniverseId: number
  onClose: () => void
  onGoToUniverse: (id: number) => void
  onGoToTrue: () => void
}

export function SwitchUniverseModal({
  open,
  currentUniverseId,
  onClose,
  onGoToUniverse,
  onGoToTrue,
}: SwitchUniverseModalProps) {
  const [editId, setEditId] = useState(String(currentUniverseId))

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Switch universe"
        className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Switch universe
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              const n = Number(editId)
              if (!Number.isFinite(n) || n < 0) return
              onGoToUniverse(n)
            }}
            className="w-full rounded-xl border border-border bg-gray-50 px-4 py-4 text-left hover:bg-gray-100"
          >
            <span className="text-sm font-semibold text-gray-900">
              Go to Universe{' '}
              <input
                type="number"
                min={0}
                value={editId}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditId(e.target.value)}
                className="inline-block w-16 rounded border border-border bg-white px-1.5 py-0.5 text-center text-sm font-semibold text-gray-900 focus:border-gray-400 focus:outline-none"
              />
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              Jump directly to a known universe id
            </span>
          </button>

          <button
            type="button"
            onClick={onGoToTrue}
            className="w-full rounded-xl border border-gray-900 bg-gray-900 px-4 py-4 text-left text-white hover:bg-gray-800"
          >
            <span className="text-sm font-semibold">Go to the True universe</span>
            <span className="mt-1 block text-xs text-gray-300">
              Answer controversial questions to arrive at the version of Augur
              that resolves correctly.
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
