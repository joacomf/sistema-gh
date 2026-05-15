"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Box } from "lucide-react"
import { deleteCajaAction } from "../actions"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type Caja = {
  id: string
  nombre: string
  ubicacion: string
  _count: { stocks: number }
}

export default function CajasList({
  cajas,
  selectedId,
  onSelect,
  onEdit,
}: {
  cajas: Caja[]
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (caja: Caja) => void
}) {
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    const result = await deleteCajaAction(id)
    setDeleting(null)
    if (!result.success) {
      setError(result.error ?? "Error al eliminar")
    } else {
      router.refresh()
    }
  }

  return (
    <>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Eliminar caja?"
        description="Se eliminará la caja. Los artículos de stock no se eliminarán. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
      <div className="space-y-1">
        {cajas.map(caja => (
          <div
            key={caja.id}
            onClick={() => onSelect(caja.id)}
            className={`cursor-pointer rounded-lg border p-3 transition-colors ${
              selectedId === caja.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Box size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{caja.nombre}</p>
                  <p className="text-xs text-slate-500 truncate">{caja.ubicacion}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-slate-400">{caja._count.stocks} art.</span>
                <button
                  onClick={e => { e.stopPropagation(); onEdit(caja) }}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  aria-label={`Editar ${caja.nombre}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmId(caja.id) }}
                  disabled={deleting === caja.id}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  aria-label={`Eliminar ${caja.nombre}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {cajas.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No se encontraron cajas.</p>
        )}
      </div>
    </>
  )
}
