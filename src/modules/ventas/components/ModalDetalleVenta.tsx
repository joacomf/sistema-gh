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

const METODO_CLS: Record<string, string> = {
  EFECTIVO:     'bg-emerald-100 text-emerald-700',
  DEBITO:       'bg-blue-100 text-blue-700',
  CREDITO:      'bg-amber-100 text-amber-700',
  MERCADO_PAGO: 'bg-violet-100 text-violet-700',
}

type Props = {
  venta: Venta
  onClose: () => void
}

export function ModalDetalleVenta({ venta, onClose }: Props) {
  const fecha = new Date(venta.fecha)
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
  const subtotalBase = venta.items.reduce((acc, i) => acc + i.subtotal, 0)
  const recargo = venta.importe - subtotalBase
  const tieneRecargo = venta.metodoPago === 'CREDITO' && recargo > 0.005

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[640px] max-w-[95vw] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <Dialog.Title className="text-base font-bold text-slate-900 leading-snug">
                {venta.descripcion}
              </Dialog.Title>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-slate-400">{hora} hs</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${METODO_CLS[venta.metodoPago] ?? 'bg-slate-100 text-slate-600'}`}>
                  {METODO_LABEL[venta.metodoPago] ?? venta.metodoPago}
                </span>
                {venta.facturada && (
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">FACTURADA</span>
                )}
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {venta.items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Venta registrada sin desglose de artículos.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-100">
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Descripción</th>
                    <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 w-16">Cant.</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-28">P. Unitario</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-28">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {venta.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-3 text-slate-700 font-medium">{item.descripcion}</td>
                      <td className="py-3 text-center text-slate-500">{item.cantidad}</td>
                      <td className="py-3 text-right text-slate-500"><Importe value={item.precioUnitario} /></td>
                      <td className="py-3 text-right font-semibold text-slate-800"><Importe value={item.subtotal} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer con totales */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
            {tieneRecargo ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span><Importe value={subtotalBase} /></span>
                </div>
                <div className="flex items-center justify-between text-sm text-amber-600 font-medium">
                  <span>Recargo tarjeta de crédito</span>
                  <span>+<Importe value={recargo} /></span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-xl font-black text-slate-900 font-mono"><Importe value={venta.importe} /></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-xl font-black text-slate-900 font-mono"><Importe value={venta.importe} /></span>
              </div>
            )}
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
