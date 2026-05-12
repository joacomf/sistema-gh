"use client"

import { useState } from "react"
import { deleteStockAction } from "../actions"
import { Pencil, Trash2 } from "lucide-react"
import { Importe } from "@/components/ui/ImporteInput"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function StockList({ stock, onEdit }: {
  stock: any[],
  onEdit: (s: any) => void
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setIsDeleting(id)
    setError(null)
    try {
      await deleteStockAction(id)
    } catch {
      setError("Error al eliminar la pieza")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Eliminar pieza?"
        description="Se eliminará esta pieza del inventario. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3.5 pl-6 pr-3 text-right text-sm font-semibold text-slate-700 w-20">
                Cant.
              </th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
                Proveedor
              </th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
                Código
              </th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
                Descripción
              </th>
              <th className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700">
                Precio venta
              </th>
              <th className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-slate-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stock.map((item) => {
              const lowStock = item.cantidad <= item.cantidadCritica
              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${lowStock ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50"}`}
                >
                  <td className="py-4 pl-6 pr-3 text-right">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ${
                      lowStock
                        ? "bg-red-50 text-red-700 ring-red-200"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    }`}>
                      {item.cantidad}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                    {item.proveedor?.nombre}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-slate-900">{item.codigo}</span>
                    {item.codigoOriginal && (
                      <div className="text-xs text-slate-400 mt-0.5">Orig: {item.codigoOriginal}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {item.descripcion}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">
                    <Importe value={Number(item.precioVenta)} />
                  </td>
                  <td className="py-4 pl-3 pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmId(item.id)}
                        disabled={isDeleting === item.id}
                        className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {isDeleting === item.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {stock.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No se encontraron piezas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
