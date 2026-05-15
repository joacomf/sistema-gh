"use client"

import { useState } from "react"
import { Package } from "lucide-react"
import { Importe } from "@/components/ui/ImporteInput"

type Caja = { id: string; nombre: string; ubicacion: string }

type Articulo = {
  id: string
  codigo: string
  codigoOriginal: string | null
  descripcion: string
  cantidad: number
  cantidadCritica: number
  cantidadSugerida: number
  fechaPedido: string | null
  fechaRecibido: string | null
  precioCosto: number
  precioLista: number
  precioVenta: number
  imagen: string | null
  proveedor: { nombre: string }
  cajas: Array<{ cajaId: string; caja: Caja }>
}

export default function DetalleArticulo({ articulo }: { articulo: Articulo }) {
  const [imgError, setImgError] = useState(false)
  const lowStock = articulo.cantidad <= articulo.cantidadCritica

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex gap-6 p-6">
        {/* Imagen */}
        <div className="shrink-0">
          {articulo.imagen && !imgError ? (
            <img
              src={articulo.imagen}
              alt={articulo.descripcion}
              onError={() => setImgError(true)}
              className="h-32 w-32 rounded-lg object-contain border border-slate-100 bg-slate-50"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
              <Package size={40} className="text-slate-200" />
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{articulo.descripcion}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>Código: <span className="font-semibold text-slate-700">{articulo.codigo}</span></span>
              {articulo.codigoOriginal && (
                <span>Código original: <span className="font-semibold text-slate-700">{articulo.codigoOriginal}</span></span>
              )}
              <span>Proveedor: <span className="font-semibold text-slate-700">{articulo.proveedor.nombre}</span></span>
            </div>
          </div>

          {/* Stock badges */}
          <div className="flex gap-3">
            <div className={`rounded-lg px-4 py-2 text-center ring-1 ring-inset ${
              lowStock ? "bg-red-50 ring-red-200" : "bg-emerald-50 ring-emerald-200"
            }`}>
              <p className="text-xs text-slate-500">Stock actual</p>
              <p className={`text-2xl font-bold ${lowStock ? "text-red-700" : "text-emerald-700"}`}>{articulo.cantidad}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-2 text-center ring-1 ring-inset ring-slate-200">
              <p className="text-xs text-slate-500">Crítico</p>
              <p className="text-2xl font-bold text-slate-700">{articulo.cantidadCritica}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-2 text-center ring-1 ring-inset ring-slate-200">
              <p className="text-xs text-slate-500">Sugerido</p>
              <p className="text-2xl font-bold text-slate-700">{articulo.cantidadSugerida}</p>
            </div>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 border border-slate-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Costo</p>
              <p className="text-base font-bold text-slate-900"><Importe value={articulo.precioCosto} /></p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lista</p>
              <p className="text-base font-bold text-slate-900"><Importe value={articulo.precioLista} /></p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Venta</p>
              <p className="text-base font-bold text-blue-700"><Importe value={articulo.precioVenta} /></p>
            </div>
          </div>

          {/* Fechas */}
          {(articulo.fechaPedido || articulo.fechaRecibido) && (
            <div className="flex gap-6 text-sm text-slate-500">
              {articulo.fechaPedido && (
                <span>Fecha pedido: <span className="text-slate-700">{new Date(articulo.fechaPedido).toLocaleDateString('es-AR')}</span></span>
              )}
              {articulo.fechaRecibido && (
                <span>Fecha recibido: <span className="text-slate-700">{new Date(articulo.fechaRecibido).toLocaleDateString('es-AR')}</span></span>
              )}
            </div>
          )}

          {/* Cajas */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              {articulo.cajas.length === 0 ? "Sin cajas asignadas" : "Cajas:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {articulo.cajas.map(sc => (
                <span
                  key={sc.cajaId}
                  className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200"
                >
                  {sc.caja.nombre} · {sc.caja.ubicacion}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
