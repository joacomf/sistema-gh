"use client"

import { useState } from "react"
import { createProveedorAction, updateProveedorAction } from "../actions"

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
    const newDescuentos = [...descuentos]
    newDescuentos[index] = { ...newDescuentos[index], [field]: value }
    setDescuentos(newDescuentos)
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {proveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input 
          type="text" 
          required 
          value={nombre} 
          onChange={e => setNombre(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notas</label>
        <textarea 
          value={notas} 
          onChange={e => setNotas(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Descuentos</label>
          <button 
            type="button" 
            onClick={handleAddDescuento}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            + Agregar Descuento
          </button>
        </div>
        
        {descuentos.map((desc, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <input 
              type="text" 
              placeholder="Descripción (ej. Pago Contado)" 
              value={desc.descripcion}
              onChange={e => handleDescuentoChange(i, 'descripcion', e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              required
            />
            <input 
              type="number" 
              step="0.01"
              placeholder="%" 
              value={desc.porcentaje}
              onChange={e => handleDescuentoChange(i, 'porcentaje', parseFloat(e.target.value))}
              className="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              required
            />
            <button 
              type="button"
              onClick={() => handleRemoveDescuento(i)}
              className="p-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Proveedor"}
        </button>
      </div>
    </form>
  )
}
