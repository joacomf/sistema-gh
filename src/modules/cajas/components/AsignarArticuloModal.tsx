"use client"

import { useState, useRef } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Search, X } from "lucide-react"
import { addStockACajaAction, buscarStockParaCajaAction } from "../actions"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

type StockResult = {
  id: string
  codigo: string
  descripcion: string
  cantidad: number
  proveedor: string
}

export default function AsignarArticuloModal({
  cajaId,
  open,
  onClose,
}: {
  cajaId: string
  open: boolean
  onClose: () => void
}) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<StockResult[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleSearch = (value: string) => {
    setQ(value)
    clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await buscarStockParaCajaAction(value, cajaId)
      setLoading(false)
      if (res.success) setResults(res.data ?? [])
    }, 400)
  }

  const handleAssign = async (stockId: string) => {
    setAssigning(stockId)
    setError(null)
    const res = await addStockACajaAction(cajaId, stockId)
    setAssigning(null)
    if (res.success) {
      setResults(prev => prev.filter(r => r.id !== stockId))
    } else {
      setError(res.error ?? "Error al asignar")
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) { setQ(""); setResults([]); setError(null); onClose() }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Asignar artículo a la caja
            </Dialog.Title>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="px-6 py-4 space-y-4 overflow-y-auto">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por código o descripción..."
                value={q}
                onChange={e => handleSearch(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
            {loading && <p className="text-center text-sm text-slate-400 py-4">Buscando...</p>}
            {!loading && results.length > 0 && (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                {results.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{r.codigo}</p>
                      <p className="text-xs text-slate-500 truncate">{r.descripcion} · {r.proveedor}</p>
                    </div>
                    <button
                      onClick={() => handleAssign(r.id)}
                      disabled={assigning === r.id}
                      className="shrink-0 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
                    >
                      {assigning === r.id ? "Asignando..." : "Asignar"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!loading && q.trim() && results.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">Sin resultados para &ldquo;{q}&rdquo;</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
