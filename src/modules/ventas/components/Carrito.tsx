"use client"

import { Trash2, ShoppingCart } from 'lucide-react'
import ImporteInput, { Importe } from '@/components/ui/ImporteInput'

export type CarritoItem = {
  stockId: string
  codigo: string
  descripcion: string
  cantidad: number
  precioCosto: number
  precioUnitario: number
  subtotal: number
}

type Props = {
  items: CarritoItem[]
  onUpdateCantidad: (stockId: string, cantidad: number) => void
  onUpdatePrecio: (stockId: string, precio: number) => void
  onRemove: (stockId: string) => void
}

export function Carrito({ items, onUpdateCantidad, onUpdatePrecio, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-300">
        <ShoppingCart size={48} className="mb-4 opacity-50" />
        <p className="text-sm">No hay artículos en la venta.</p>
        <p className="text-xs mt-1">Buscá un artículo para comenzar.</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b-2 border-slate-200">
          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 w-1/6">Código</th>
          <th className="pb-3 pl-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Descripción</th>
          <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 w-20">Cant.</th>
          <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-32">P. Venta</th>
          <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-28">Subtotal</th>
          <th className="pb-3 w-10" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map(item => (
          <tr key={item.stockId}>
            <td className="py-3.5 font-mono font-semibold text-sm text-slate-700">{item.codigo}</td>
            <td className="py-3.5 pl-4 text-sm text-slate-600">{item.descripcion}</td>
            <td className="py-3.5 text-center">
              <input
                type="number"
                min={1}
                value={item.cantidad}
                onChange={e => onUpdateCantidad(item.stockId, Math.max(1, Number(e.target.value)))}
                className="w-16 text-center font-bold text-sm border border-slate-200 rounded-lg py-1.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </td>
            <td className="py-3.5 text-right">
              <ImporteInput
                value={item.precioUnitario}
                onChange={v => onUpdatePrecio(item.stockId, v)}
                className="w-28 text-right text-sm border border-slate-200 rounded-lg py-1.5 px-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </td>
            <td className="py-3.5 text-right font-bold text-sm text-slate-900">
              <Importe value={item.subtotal} />
            </td>
            <td className="py-3.5 text-center">
              <button
                type="button"
                onClick={() => onRemove(item.stockId)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
