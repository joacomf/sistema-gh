"use client"

import { useState } from "react"
import { createProveedorAction, updateProveedorAction } from "../actions"
import { X, Plus } from "lucide-react"

type Descuento = { id?: string; descripcion: string; porcentaje: number }

export default function ProveedorForm({
  proveedor,
  onSuccess
}: {
  proveedor?: { id: string, nombre: string, notas: string | null, descuentos: Descuento[] },
  onSuccess: () => void
}) {
  const [nombre, setNombre] = useState(proveedor?.nombre || "")
  const [notas, setNotas] = useState(proveedor?.notas || "")
  const [descuentos, setDescuentos] = useState<Descuento[]>(proveedor?.descuentos || [])
  const [loading, setLoading] = useState(false)

  const handleAddDescuento = () => {
    setDescuentos([...descuentos, { descripcion: "", porcentaje: 0 }])
  }

  const handleDescuentoChange = (index: number, field: keyof Descuento, value: string | number) => {
    const updated = [...descuentos]
    updated[index] = { ...updated[index], [field]: value }
    setDescuentos(updated)
  }

  const handleRemoveDescuento = (index: number) => {
    setDescuentos(descuentos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { nombre, notas, descuentos }
      if (proveedor?.id) {
        await updateProveedorAction(proveedor.id, data)
      } else {
        await createProveedorAction(data)
      }
      onSuccess()
    } catch (error) {
      console.error(error)
      alert("Ocurrió un error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Nombre del proveedor"
          className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={3}
          placeholder="Observaciones opcionales"
          className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
        />
      </div>

      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700">Descuentos</span>
          <button
            type="button"
            onClick={handleAddDescuento}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Plus size={15} />
            Agregar descuento
          </button>
        </div>

        <div className="space-y-2">
          {descuentos.map((desc, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Descripción (ej: Pago contado)"
                value={desc.descripcion}
                onChange={e => handleDescuentoChange(i, "descripcion", e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="%"
                value={desc.porcentaje}
                onChange={e => handleDescuentoChange(i, "porcentaje", parseFloat(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveDescuento(i)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {descuentos.length === 0 && (
            <p className="text-sm text-slate-400 py-1">Sin descuentos cargados.</p>
          )}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Guardar proveedor"}
        </button>
      </div>
    </form>
  )
}
