"use client"

import { X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { Importe } from '@/components/ui/ImporteInput'

type VentaItem = {
  id: string
  ventaId: string
  stockId: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

type Venta = {
  id: string
  descripcion: string
  importe: number
  metodoPago: string
  facturada: boolean
  fecha: Date | string
  items: VentaItem[]
}

const METODO_LABEL: Record<string, string> = {
  EFECTIVO:     'Efectivo',
  DEBITO:       'Débito',
  CREDITO:      'Crédito',
  MERCADO_PAGO: 'Mercado Pago',
}

type Props = {
  venta: Venta
  onClose: () => void
}

export function ModalDetalleVenta({ venta, onClose }: Props) {
  const fecha = new Date(venta.fecha)
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-slate-100">
            <div>
              <Dialog.Title className="text-[15px] font-bold text-slate-900">
                {venta.descripcion}
              </Dialog.Title>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span>{hora} hs</span>
                <span>{METODO_LABEL[venta.metodoPago] ?? venta.metodoPago}</span>
                {venta.facturada && (
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">F</span>
                )}
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 max-h-96 overflow-y-auto">
            {venta.items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Venta registrada sin desglose de artículos.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Descripción</th>
                    <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 w-16">Cant.</th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-24">P. Unit.</th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {venta.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2.5 text-slate-700">{item.descripcion}</td>
                      <td className="py-2.5 text-center text-slate-600">{item.cantidad}</td>
                      <td className="py-2.5 text-right text-slate-600"><Importe value={item.precioUnitario} /></td>
                      <td className="py-2.5 text-right font-bold text-slate-900"><Importe value={item.subtotal} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-slate-600">Total</td>
                    <td className="pt-3 text-right text-base font-black text-slate-900">
                      <Importe value={venta.importe} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
