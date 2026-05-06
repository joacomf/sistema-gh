"use client"

import { useState, useEffect } from "react"
import { createStockAction, updateStockAction } from "../actions"

export default function StockForm({ 
  stock, 
  proveedores,
  onSuccess 
}: { 
  stock?: any,
  proveedores: any[],
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    proveedorId: stock?.proveedorId || (proveedores.length > 0 ? proveedores[0].id : ""),
    codigo: stock?.codigo || "",
    codigoOriginal: stock?.codigoOriginal || "",
    descripcion: stock?.descripcion || "",
    cantidad: stock?.cantidad || 0,
    cantidadCritica: stock?.cantidadCritica || 0,
    cantidadSugerida: stock?.cantidadSugerida || 0,
    precioLista: stock?.precioLista ? Number(stock.precioLista) : 0,
    precioCosto: stock?.precioCosto ? Number(stock.precioCosto) : 0,
    precioVenta: stock?.precioVenta ? Number(stock.precioVenta) : 0,
    fechaPedido: stock?.fechaPedido ? new Date(stock.fechaPedido).toISOString().split('T')[0] : "",
    fechaRecibido: stock?.fechaRecibido ? new Date(stock.fechaRecibido).toISOString().split('T')[0] : "",
  })
  const [loading, setLoading] = useState(false)

  // Auto-calcular Precio Costo basado en Precio Lista y Descuentos del Proveedor
  useEffect(() => {
    if (formData.precioLista > 0 && formData.proveedorId) {
      const selectedProv = proveedores.find(p => p.id === formData.proveedorId)
      if (selectedProv && selectedProv.descuentos) {
        let costoCalc = formData.precioLista;
        // Se aplican descuentos en cascada
        selectedProv.descuentos.forEach((d: any) => {
          costoCalc = costoCalc * (1 - (Number(d.porcentaje) / 100))
        })
        setFormData(prev => ({ ...prev, precioCosto: Number(costoCalc.toFixed(2)) }))
      }
    }
  }, [formData.precioLista, formData.proveedorId, proveedores])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const dataToSubmit = {
        ...formData,
        cantidad: Number(formData.cantidad),
        cantidadCritica: Number(formData.cantidadCritica),
        cantidadSugerida: Number(formData.cantidadSugerida),
        precioLista: Number(formData.precioLista),
        precioCosto: Number(formData.precioCosto),
        precioVenta: Number(formData.precioVenta),
        fechaPedido: formData.fechaPedido ? new Date(formData.fechaPedido) : undefined,
        fechaRecibido: formData.fechaRecibido ? new Date(formData.fechaRecibido) : undefined,
      }

      if (stock?.id) {
        await updateStockAction(stock.id, dataToSubmit)
      } else {
        await createStockAction(dataToSubmit as any)
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
      <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
        {stock ? "Editar Pieza de Stock" : "Nueva Pieza de Stock"}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Proveedor</label>
          <select 
            name="proveedorId"
            value={formData.proveedorId}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
          >
            <option value="" disabled>Seleccione un proveedor</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Código interno</label>
          <input 
            type="text" name="codigo" required value={formData.codigo} onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Código Original</label>
          <input 
            type="text" name="codigoOriginal" value={formData.codigoOriginal} onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <input 
            type="text" name="descripcion" required value={formData.descripcion} onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad Actual</label>
          <input 
            type="number" name="cantidad" required min="0" value={formData.cantidad} onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Cant. Crítica</label>
            <input 
              type="number" name="cantidadCritica" min="0" value={formData.cantidadCritica} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Cant. Sugerida</label>
            <input 
              type="number" name="cantidadSugerida" min="0" value={formData.cantidadSugerida} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Lista</label>
            <input 
              type="number" step="0.01" name="precioLista" required min="0" value={formData.precioLista} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Costo</label>
            <input 
              type="number" step="0.01" name="precioCosto" required min="0" value={formData.precioCosto} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Venta</label>
            <input 
              type="number" step="0.01" name="precioVenta" required min="0" value={formData.precioVenta} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Pedido</label>
          <input 
            type="date" name="fechaPedido" value={formData.fechaPedido} onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Recibido</label>
          <input 
            type="date" name="fechaRecibido" value={formData.fechaRecibido} onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Pieza"}
        </button>
      </div>
    </form>
  )
}
