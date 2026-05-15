"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, Check, Banknote, CreditCard, Landmark, QrCode } from 'lucide-react'
import { editarVentaAction } from '@/modules/ventas/actions'
import ImporteInput, { Importe } from '@/components/ui/ImporteInput'
import { cn } from '@/lib/utils'

type MetodoPago = 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'MERCADO_PAGO'

const METODOS: { key: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { key: 'EFECTIVO',     label: 'Efectivo',    icon: <Banknote size={15} /> },
  { key: 'DEBITO',       label: 'Débito',      icon: <Landmark size={15} /> },
  { key: 'CREDITO',      label: 'Crédito',     icon: <CreditCard size={15} /> },
  { key: 'MERCADO_PAGO', label: 'Mercado Pago', icon: <QrCode size={15} /> },
]

type ItemEditable = {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
}

type Venta = {
  id: string
  descripcion: string
  importe: number
  metodoPago: string
  facturada: boolean
  items: { id: string; descripcion: string; cantidad: number; precioUnitario: number; subtotal: number }[]
}

type Props = {
  venta: Venta
  recargo: number
  onClose: () => void
}

export function ModalEditarVenta({ venta, recargo, onClose }: Props) {
  const router = useRouter()
  const [metodo, setMetodo] = useState<MetodoPago>(venta.metodoPago as MetodoPago)
  const [facturada, setFacturada] = useState(venta.facturada)
  const [items, setItems] = useState<ItemEditable[]>(
    venta.items.map(i => ({ id: i.id, descripcion: i.descripcion, cantidad: i.cantidad, precioUnitario: i.precioUnitario }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseTotal = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)
  const recargoMonto = metodo === 'CREDITO' ? baseTotal * (recargo / 100) : 0
  const total = baseTotal + recargoMonto

  function updatePrecio(id: string, precio: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, precioUnitario: precio } : i))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const result = await editarVentaAction({
        id: venta.id,
        metodoPago: metodo,
        facturada,
        items: items.map(i => ({ id: i.id, precioUnitario: i.precioUnitario, cantidad: i.cantidad })),
      })
      if (result.success) {
        router.refresh()
        onClose()
      } else {
        setError(result.error ?? 'Error al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[500px] max-w-[95vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-900">Editar venta</Dialog.Title>
              <p className="text-xs text-slate-400 mt-0.5 max-w-[340px] truncate">{venta.descripcion}</p>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Método de pago */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Método de pago</p>
              <div className="grid grid-cols-2 gap-2">
                {METODOS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMetodo(key)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all',
                      metodo === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Artículos */}
            {items.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Artículos</p>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Descripción</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide w-12">Cant.</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide w-36">P. Unitario</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map(item => (
                        <tr key={item.id}>
                          <td className="px-3 py-2.5 text-slate-700 font-medium text-xs leading-tight">{item.descripcion}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500">{item.cantidad}</td>
                          <td className="px-3 py-2">
                            <ImporteInput
                              value={item.precioUnitario}
                              onChange={v => updatePrecio(item.id, v)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-700 tabular-nums">
                            <Importe value={item.precioUnitario * item.cantidad} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Facturada */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={facturada}
                onChange={e => setFacturada(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">Marcar como facturada</span>
            </label>

            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          {/* Footer con totales + botón */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
            <div className="space-y-1 text-sm">
              {recargoMonto > 0 && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span><Importe value={baseTotal} /></span>
                  </div>
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Recargo tarjeta ({recargo}%)</span>
                    <span>+<Importe value={recargoMonto} /></span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span className="text-base font-black font-mono"><Importe value={total} /></span>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
