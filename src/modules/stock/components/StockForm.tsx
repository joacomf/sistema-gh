"use client"

import { useState, useEffect } from "react"
import { createStockAction, updateStockAction } from "../actions"
import ImporteInput from "@/components/ui/ImporteInput"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

const inputCls = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"

export default function StockForm({
  stock,
  proveedores,
  onSuccess,
}: {
  stock?: any
  proveedores: any[]
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
    fechaPedido: stock?.fechaPedido ? new Date(stock.fechaPedido).toISOString().split("T")[0] : "",
    fechaRecibido: stock?.fechaRecibido ? new Date(stock.fechaRecibido).toISOString().split("T")[0] : "",
    imagen: stock?.imagen || "",
  })
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (formData.precioLista > 0 && formData.proveedorId) {
      const selectedProv = proveedores.find(p => p.id === formData.proveedorId)
      if (selectedProv?.descuentos) {
        let costo = formData.precioLista
        selectedProv.descuentos.forEach((d: any) => {
          costo = costo * (1 - Number(d.porcentaje) / 100)
        })
        setFormData(prev => ({ ...prev, precioCosto: Number(costo.toFixed(2)) }))
      }
    }
  }, [formData.precioLista, formData.proveedorId, proveedores])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePrecio = (field: "precioLista" | "precioCosto" | "precioVenta") => (value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)
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
        imagen: formData.imagen || undefined,
      }
      if (stock?.id) {
        await updateStockAction(stock.id, dataToSubmit)
      } else {
        await createStockAction(dataToSubmit as any)
      }
      onSuccess()
    } catch (error) {
      console.error(error)
      setSubmitError("Ocurrió un error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Proveedor</label>
          <select
            name="proveedorId"
            value={formData.proveedorId}
            onChange={handleChange}
            required
            className={inputCls + " bg-white"}
          >
            <option value="" disabled>Seleccione un proveedor</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Código interno</label>
          <input type="text" name="codigo" required value={formData.codigo} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Código Original</label>
          <input type="text" name="codigoOriginal" value={formData.codigoOriginal} onChange={handleChange} className={inputCls} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <input type="text" name="descripcion" required value={formData.descripcion} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad Actual</label>
          <input type="number" name="cantidad" required min="0" value={formData.cantidad} onChange={handleChange} className={inputCls} />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Cant. Crítica</label>
            <input type="number" name="cantidadCritica" min="0" value={formData.cantidadCritica} onChange={handleChange} className={inputCls} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Cant. Sugerida</label>
            <input type="number" name="cantidadSugerida" min="0" value={formData.cantidadSugerida} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Precio Lista</label>
            <ImporteInput value={formData.precioLista} onChange={handlePrecio("precioLista")} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Precio Costo</label>
            <ImporteInput value={formData.precioCosto} onChange={handlePrecio("precioCosto")} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Precio Venta</label>
            <ImporteInput value={formData.precioVenta} onChange={handlePrecio("precioVenta")} required className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Pedido</label>
          <input type="date" name="fechaPedido" value={formData.fechaPedido} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Recibido</label>
          <input type="date" name="fechaRecibido" value={formData.fechaRecibido} onChange={handleChange} className={inputCls} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">URL de Imagen</label>
          <input
            type="url"
            name="imagen"
            value={formData.imagen}
            onChange={handleChange}
            className={inputCls}
            placeholder="https://..."
          />
          {formData.imagen && (
            <img
              src={formData.imagen}
              alt="Preview"
              className="mt-2 h-24 w-auto rounded-md object-contain border border-slate-200 bg-slate-50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
      </div>

      {submitError && (
        <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />
      )}

      <div className="pt-2 flex justify-end">
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
