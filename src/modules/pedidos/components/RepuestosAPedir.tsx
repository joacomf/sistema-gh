"use client"

import { useState } from "react"
import { marcarComoPedidoAction, deleteRepuestoPedidoAction } from "../actions"
import { CheckCircle, Trash2 } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function RepuestosAPedir({ items }: { items: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleMarcar = async (id: string) => {
    setLoadingId(id)
    setError(null)
    try {
      const res = await marcarComoPedidoAction(id)
      if (!res.success) setError(res.error ?? "Error al marcar como pedido")
    } finally {
      setLoadingId(null)
    }
  }

  const handleEliminar = async () => {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setLoadingId(id)
    setError(null)
    try {
      const res = await deleteRepuestoPedidoAction(id)
      if (!res.success) setError(res.error ?? "Error al eliminar")
    } finally {
      setLoadingId(null)
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
        title="¿Eliminar repuesto?"
        description="Se quitará este artículo de la lista de pedidos pendientes."
        confirmLabel="Eliminar"
        onConfirm={handleEliminar}
        onCancel={() => setConfirmId(null)}
      />
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3.5 pl-6 pr-3 text-right text-sm font-semibold text-slate-700 w-20">Cant.</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Proveedor</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Código</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Descripción</th>
              <th className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 pl-6 pr-3 text-right">
                  <span className="inline-flex items-center justify-center rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
                    {item.cantidad}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                  {item.stock.proveedor?.nombre}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-slate-900">{item.stock.codigo}</span>
                  {item.stock.codigoOriginal && (
                    <div className="text-xs text-slate-400 mt-0.5">Orig: {item.stock.codigoOriginal}</div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{item.stock.descripcion}</td>
                <td className="py-4 pl-3 pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleMarcar(item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      Marcar como pedido
                    </button>
                    <button
                      onClick={() => setConfirmId(item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No hay repuestos pendientes de pedir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
