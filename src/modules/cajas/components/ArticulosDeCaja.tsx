"use client"

import { useState, useMemo } from "react"
import { Search, Trash2 } from "lucide-react"
import { removeStockDeCajaAction } from "../actions"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type StockItem = {
  stockId: string
  stock: {
    id: string
    codigo: string
    descripcion: string
    cantidad: number
    proveedor: { nombre: string }
  }
}

export default function ArticulosDeCaja({
  cajaId,
  articulos,
  onAsignar,
}: {
  cajaId: string
  articulos: StockItem[]
  onAsignar: () => void
}) {
  const [q, setQ] = useState("")
  const [confirmStockId, setConfirmStockId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(
    () => articulos.filter(a =>
      a.stock.codigo.toLowerCase().includes(q.toLowerCase()) ||
      a.stock.descripcion.toLowerCase().includes(q.toLowerCase())
    ),
    [articulos, q]
  )

  const handleRemove = async () => {
    if (!confirmStockId) return
    const id = confirmStockId
    setConfirmStockId(null)
    setRemoving(id)
    const result = await removeStockDeCajaAction(cajaId, id)
    setRemoving(null)
    if (!result.success) setError(result.error ?? "Error al quitar artículo")
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={confirmStockId !== null}
        title="¿Quitar artículo de la caja?"
        description="El artículo se quitará de esta caja pero no se eliminará del stock."
        confirmLabel="Quitar"
        onConfirm={handleRemove}
        onCancel={() => setConfirmStockId(null)}
      />
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar artículo..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          onClick={onAsignar}
          className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
        >
          + Asignar
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Código</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Proveedor</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cant.</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(a => (
              <tr key={a.stockId} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{a.stock.codigo}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{a.stock.descripcion}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{a.stock.proveedor.nombre}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{a.stock.cantidad}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setConfirmStockId(a.stockId)}
                    disabled={removing === a.stockId}
                    className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label={`Quitar ${a.stock.descripcion}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                  {articulos.length === 0
                    ? "Esta caja no tiene artículos asignados."
                    : "No se encontraron artículos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
