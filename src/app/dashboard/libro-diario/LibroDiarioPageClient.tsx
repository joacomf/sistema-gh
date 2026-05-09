"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, Trash2, Plus, Loader2, Check } from 'lucide-react'
import { ModalDetalleVenta } from '@/modules/ventas/components/ModalDetalleVenta'
import { eliminarVentaAction, agregarGastoAction, eliminarGastoAction } from '@/modules/ventas/actions'
import ImporteInput, { Importe } from '@/components/ui/ImporteInput'
import { cn } from '@/lib/utils'

type VentaItem = { id: string; ventaId: string; stockId: string; descripcion: string; cantidad: number; precioUnitario: number; subtotal: number }
type Venta = { id: string; descripcion: string; importe: number; metodoPago: string; facturada: boolean; fecha: Date | string; items: VentaItem[] }
type Gasto = { id: string; descripcion: string; importe: number; fecha: Date | string }

const METODO_BADGE: Record<string, { label: string; cls: string }> = {
  EFECTIVO:     { label: 'Efectivo',     cls: 'bg-emerald-100 text-emerald-700' },
  DEBITO:       { label: 'Débito',       cls: 'bg-blue-100 text-blue-700' },
  CREDITO:      { label: 'Crédito',      cls: 'bg-amber-100 text-amber-700' },
  MERCADO_PAGO: { label: 'M.Pago',       cls: 'bg-violet-100 text-violet-700' },
}

function toHora(fecha: Date | string) {
  return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

type Props = {
  ventas: Venta[]
  gastos: Gasto[]
  fecha: string
}

export default function LibroDiarioPageClient({ ventas, gastos, fecha }: Props) {
  const router = useRouter()
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const [showGastoForm, setShowGastoForm] = useState(false)
  const [gastoDesc, setGastoDesc] = useState('')
  const [gastoImporte, setGastoImporte] = useState<number>(0)
  const [savingGasto, setSavingGasto] = useState(false)

  const totalEfe  = ventas.filter(v => v.metodoPago === 'EFECTIVO').reduce((a, v) => a + v.importe, 0)
  const totalDeb  = ventas.filter(v => v.metodoPago === 'DEBITO').reduce((a, v) => a + v.importe, 0)
  const totalCred = ventas.filter(v => v.metodoPago === 'CREDITO').reduce((a, v) => a + v.importe, 0)
  const totalMP   = ventas.filter(v => v.metodoPago === 'MERCADO_PAGO').reduce((a, v) => a + v.importe, 0)
  const totalGastos = gastos.reduce((a, g) => a + g.importe, 0)
  const cajaNeta  = totalEfe + totalDeb + totalCred + totalMP - totalGastos

  async function handleEliminarVenta(id: string) {
    if (!confirm('¿Eliminar esta venta?')) return
    setLoadingId(id)
    try {
      await eliminarVentaAction(id)
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  async function handleEliminarGasto(id: string) {
    if (!confirm('¿Eliminar este egreso?')) return
    setLoadingId(id)
    try {
      await eliminarGastoAction(id)
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  async function handleGuardarGasto() {
    if (!gastoDesc.trim() || gastoImporte <= 0) return
    setSavingGasto(true)
    try {
      await agregarGastoAction({ descripcion: gastoDesc, importe: gastoImporte })
      setGastoDesc('')
      setGastoImporte(0)
      setShowGastoForm(false)
      router.refresh()
    } finally {
      setSavingGasto(false)
    }
  }

  const SummaryCard = ({ label, amount, count, cls }: { label: string; amount: number; count?: number; cls: string }) => (
    <div className={cn('flex-1 rounded-2xl border-[1.5px] border-slate-200 bg-white p-4 shadow-sm', cls)}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black font-mono"><Importe value={amount} /></p>
      {count !== undefined && <p className="text-xs opacity-60 mt-0.5">{count} {count === 1 ? 'venta' : 'ventas'}</p>}
    </div>
  )

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Libro Diario</h1>
          <input
            type="date"
            value={fecha}
            onChange={e => router.push(`/dashboard/libro-diario?fecha=${e.target.value}`)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Printer size={16} /> Imprimir cierre
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <SummaryCard label="Efectivo"     amount={totalEfe}    count={ventas.filter(v => v.metodoPago === 'EFECTIVO').length}     cls="text-emerald-700" />
        <SummaryCard label="Débito"       amount={totalDeb}    count={ventas.filter(v => v.metodoPago === 'DEBITO').length}       cls="text-blue-700" />
        <SummaryCard label="Crédito"      amount={totalCred}   count={ventas.filter(v => v.metodoPago === 'CREDITO').length}      cls="text-amber-700" />
        <SummaryCard label="Mercado Pago" amount={totalMP}     count={ventas.filter(v => v.metodoPago === 'MERCADO_PAGO').length} cls="text-violet-700" />
        <div className="flex-1 rounded-2xl bg-slate-900 p-4 shadow-sm text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Caja neta</p>
          <p className="mt-1 text-2xl font-black font-mono"><Importe value={cajaNeta} /></p>
          <p className="text-xs text-slate-500 mt-0.5">ventas − egresos</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-700">Ventas del día</h2>
            <span className="text-xs text-slate-400">{ventas.length} ventas</span>
          </div>
          <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Productos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Pago</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Importe</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ventas.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No hay ventas para este día.</td></tr>
                )}
                {ventas.map(v => {
                  const badge = METODO_BADGE[v.metodoPago]
                  return (
                    <tr key={v.id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setVentaDetalle(v)}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{toHora(v.fecha)}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">
                        {v.descripcion}
                        {v.facturada && <span className="ml-1.5 rounded bg-blue-600 px-1 py-0.5 text-[9px] font-bold text-white">F</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', badge?.cls)}>
                          {badge?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        <Importe value={v.importe} />
                      </td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleEliminarVenta(v.id)}
                          disabled={loadingId === v.id}
                          className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {loadingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-700">Egresos del día</h2>
            <span className="text-xs text-slate-400">{gastos.length} egresos</span>
          </div>
          <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Concepto</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Importe</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gastos.length === 0 && !showGastoForm && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">Sin egresos.</td></tr>
                )}
                {gastos.map(g => (
                  <tr key={g.id}>
                    <td className="px-4 py-3 text-slate-700">{g.descripcion}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600"><Importe value={g.importe} /></td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEliminarGasto(g.id)}
                        disabled={loadingId === g.id}
                        className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {loadingId === g.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {showGastoForm && (
                  <tr>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={gastoDesc}
                        onChange={e => setGastoDesc(e.target.value)}
                        placeholder="Concepto..."
                        autoFocus
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ImporteInput
                        value={gastoImporte}
                        onChange={v => setGastoImporte(v)}
                        placeholder="0,00"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-right font-bold focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={handleGuardarGasto}
                        disabled={savingGasto}
                        className="text-emerald-500 hover:text-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {savingGasto ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-4 py-3">
                    <button
                      onClick={() => setShowGastoForm(v => !v)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Plus size={13} /> Agregar egreso
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {ventaDetalle && (
        <ModalDetalleVenta venta={ventaDetalle} onClose={() => setVentaDetalle(null)} />
      )}
    </div>
  )
}
