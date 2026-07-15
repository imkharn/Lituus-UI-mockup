import { useEffect, useRef } from 'react'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  onAddRep: () => void
  onReset: () => void
  onSkipTime: () => void
}

export function SettingsModal({
  open,
  onClose,
  onAddRep,
  onReset,
  onSkipTime,
}: SettingsModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="w-full max-w-sm rounded-xl border border-border bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Mock controls for exploring the UI. These do not reflect on-chain
          behavior.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onAddRep()
              onClose()
            }}
            className="w-full rounded-lg border border-border bg-gray-50 px-4 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            Add 10,000 REP
            <span className="mt-0.5 block text-xs font-normal text-gray-500">
              Credit your mock wallet
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSkipTime()
              onClose()
            }}
            className="w-full rounded-lg border border-border bg-gray-50 px-4 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            Skip forward 2 hours
            <span className="mt-0.5 block text-xs font-normal text-gray-500">
              Advance all open query timers
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onReset()
              onClose()
            }}
            className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-left text-sm font-medium text-red-900 hover:bg-red-100"
          >
            Reset
            <span className="mt-0.5 block text-xs font-normal text-red-700/80">
              Restore queries and wallet to the starting state
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
