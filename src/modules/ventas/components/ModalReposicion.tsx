"use client"

import { useState } from 'react'
import { Loader2, Package } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

type ReposicionItem = {
  stockId: string
  descripcion: string
  cantidadSugerida: number
}

type Props = {
  items: ReposicionItem[]
  onConfirm: (pedidos: { stockId: string; cantidad: number }[]) => void
  onSkip: () => void
  loading: boolean
}

export function ModalReposicion({ items, onConfirm, onSkip, loading }: Props) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(
    () => new Set(items.map(i => i.stockId))
  )
  const [cantidades, setCantidades] = useState<Record<string, number>>(
    () => Object.fromEntries(items.map(i => [i.stockId, i.cantidadSugerida]))
  )

  function toggleItem(stockId: string) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(stockId)) next.delete(stockId)
      else next.add(stockId)
      return next
    })
  }

  function handleConfirm() {
    const pedidos = items
      .filter(i => seleccionados.has(i.stockId))
      .map(i => ({ stockId: i.stockId, cantidad: cantidades[i.stockId] ?? i.cantidadSugerida }))
    onConfirm(pedidos)
  }

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-1">
            <Package size={20} className="text-blue-600" />
            <Dialog.Title className="text-base font-bold text-slate-900">
              ¿Reponer artículos?
            </Dialog.Title>
          </div>
          <Dialog.Description className="text-xs text-slate-500 mb-5">
            Seleccioná los artículos que querés agregar al pedido.
          </Dialog.Description>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {items.map(item => (
              <div key={item.stockId} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={seleccionados.has(item.stockId)}
                  onChange={() => toggleItem(item.stockId)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="flex-1 text-sm text-slate-700">{item.descripcion}</span>
                <input
                  type="number"
                  min={1}
                  value={cantidades[item.stockId] ?? item.cantidadSugerida}
                  onChange={e => setCantidades(prev => ({ ...prev, [item.stockId]: Math.max(1, Number(e.target.value)) }))}
                  className="w-16 rounded-lg border border-slate-200 py-1 text-center text-sm font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Omitir
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || seleccionados.size === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              Agregar al pedido →
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
