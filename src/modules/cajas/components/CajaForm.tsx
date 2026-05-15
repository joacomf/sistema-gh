"use client"

import { useState } from "react"
import { createCajaAction, updateCajaAction } from "../actions"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

const inputCls = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"

export default function CajaForm({
  caja,
  onSuccess,
}: {
  caja?: { id: string; nombre: string; ubicacion: string } | null
  onSuccess: () => void
}) {
  const [nombre, setNombre] = useState(caja?.nombre ?? "")
  const [ubicacion, setUbicacion] = useState(caja?.ubicacion ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = caja?.id
      ? await updateCajaAction(caja.id, { nombre, ubicacion })
      : await createCajaAction({ nombre, ubicacion })
    setLoading(false)
    if (result.success) {
      onSuccess()
    } else {
      setError(result.error ?? "Error al guardar")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className={inputCls}
          placeholder="Ej: Caja A-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Ubicación</label>
        <input
          type="text"
          value={ubicacion}
          onChange={e => setUbicacion(e.target.value)}
          required
          className={inputCls}
          placeholder="Ej: Depósito Planta Baja"
        />
      </div>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Caja"}
        </button>
      </div>
    </form>
  )
}
