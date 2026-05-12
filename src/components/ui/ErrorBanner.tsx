"use client"

type Props = {
  message: string | null
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar"
        className="text-red-400 hover:text-red-600 transition-colors font-bold leading-none"
      >
        ×
      </button>
    </div>
  )
}
