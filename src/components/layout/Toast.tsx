import { useEffect } from 'react'

interface ToastProps {
  message: string | null
  onClose: () => void
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(onClose, 3500)
    return () => window.clearTimeout(id)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-border bg-white px-4 py-3 shadow-lg">
      <p className="text-sm text-gray-900">{message}</p>
    </div>
  )
}
