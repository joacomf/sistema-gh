"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, Trash2, Plus, Loader2, Check, BookOpen } from 'lucide-react'
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
  return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
}

type Props = { ventas: Venta[]; gastos: Gasto[]; fecha: string }

export default function LibroDiarioPageClient({ ventas, gastos, fecha }: Props) {
  const router = useRouter()
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [showGastoForm, setShowGastoForm] = useState(false)
  const [gastoDesc, setGastoDesc] = useState('')
  const [gastoImporte, setGastoImporte] = useState<number>(0)
  const [savingGasto, setSavingGasto] = useState(false)

  const counts = ventas.reduce(
    (acc, v) => { acc[v.metodoPago] = (acc[v.metodoPago] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )
  const totals = ventas.reduce(
    (acc, v) => { acc[v.metodoPago] = (acc[v.metodoPago] ?? 0) + v.importe; return acc },
    {} as Record<string, number>
  )
  const totalGastos = gastos.reduce((a, g) => a + g.importe, 0)
  const totalVentas = ventas.reduce((a, v) => a + v.importe, 0)
  const cajaNeta = totalVentas - totalGastos

  async function handleEliminarVenta(id: string) {
    if (!confirm('¿Eliminar esta venta?')) return
    setLoadingId(id)
    try {
      const result = await eliminarVentaAction(id)
      if (result.success) router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  async function handleEliminarGasto(id: string) {
    if (!confirm('¿Eliminar este egreso?')) return
    setLoadingId(id)
    try {
      const result = await eliminarGastoAction(id)
      if (result.success) router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  async function handleGuardarGasto() {
    if (!gastoDesc.trim() || gastoImporte <= 0) return
    setSavingGasto(true)
    try {
      const result = await agregarGastoAction({ descripcion: gastoDesc, importe: gastoImporte })
      if (result.success) {
        setGastoDesc('')
        setGastoImporte(0)
        setShowGastoForm(false)
        router.refresh()
      }
    } finally {
      setSavingGasto(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Libro Diario</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {ventas.length === 0
              ? 'Sin ventas registradas para este día'
              : `${ventas.length} venta${ventas.length !== 1 ? 's' : ''} · ${gastos.length} egreso${gastos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={e => router.push(`/dashboard/libro-diario?fecha=${e.target.value}`)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none shadow-sm"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { key: 'EFECTIVO',     label: 'Efectivo',     accent: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
          { key: 'DEBITO',       label: 'Débito',       accent: 'border-blue-200 bg-blue-50',       text: 'text-blue-700' },
          { key: 'CREDITO',      label: 'Crédito',      accent: 'border-amber-200 bg-amber-50',     text: 'text-amber-700' },
          { key: 'MERCADO_PAGO', label: 'Mercado Pago', accent: 'border-violet-200 bg-violet-50',   text: 'text-violet-700' },
        ].map(({ key, label, accent, text }) => (
          <div key={key} className={cn('rounded-xl border-[1.5px] p-4 shadow-sm', accent)}>
            <p className={cn('text-xs font-semibold uppercase tracking-wide', text)}>{label}</p>
            <p className={cn('mt-1.5 text-xl font-black font-mono leading-none', text)}>
              <Importe value={totals[key] ?? 0} />
            </p>
            <p className={cn('text-xs mt-1 opacity-70', text)}>
              {counts[key] ?? 0} {(counts[key] ?? 0) === 1 ? 'venta' : 'ventas'}
            </p>
          </div>
        ))}
        <div className="rounded-xl border-[1.5px] border-slate-800 bg-slate-900 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Caja neta</p>
          <p className={cn('mt-1.5 text-xl font-black font-mono leading-none', cajaNeta >= 0 ? 'text-white' : 'text-red-400')}>
            <Importe value={cajaNeta} />
          </p>
          <p className="text-xs mt-1 text-slate-500">ventas − egresos</p>
        </div>
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-[1fr_380px] gap-6 items-start">

        {/* Ventas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Ventas del día</h2>
            <span className="text-sm font-semibold text-slate-500">
              Total: <span className="text-slate-900"><Importe value={totalVentas} /></span>
            </span>
          </div>
          <div className="rounded-xl border-[1.5px] border-slate-200 bg-white shadow-sm overflow-hidden">
            {ventas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-300">
                <BookOpen size={36} className="mb-3 opacity-50" />
                <p className="text-sm">Sin ventas para este día.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 w-16">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Productos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 w-28">Método</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-28">Importe</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ventas.map(v => {
                    const badge = METODO_BADGE[v.metodoPago]
                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                        onClick={() => setVentaDetalle(v)}
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">{toHora(v.fecha)}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-slate-700 font-medium line-clamp-1">{v.descripcion}</span>
                          {v.facturada && (
                            <span className="ml-2 rounded bg-blue-600 px-1 py-0.5 text-[9px] font-bold text-white align-middle">F</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', badge?.cls)}>
                            {badge?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                          <Importe value={v.importe} />
                        </td>
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleEliminarVenta(v.id)}
                            disabled={loadingId === v.id}
                            className="text-slate-200 hover:text-red-500 transition-colors disabled:opacity-50 group-hover:text-slate-300"
                          >
                            {loadingId === v.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Egresos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Egresos del día</h2>
            {gastos.length > 0 && (
              <span className="text-sm font-semibold text-red-600">
                −<Importe value={totalGastos} />
              </span>
            )}
          </div>
          <div className="rounded-xl border-[1.5px] border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Concepto</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-28">Importe</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gastos.length === 0 && !showGastoForm && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-400">
                      Sin egresos registrados.
                    </td>
                  </tr>
                )}
                {gastos.map(g => (
                  <tr key={g.id}>
                    <td className="px-4 py-3.5 text-slate-700">{g.descripcion}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-red-600 whitespace-nowrap">
                      <Importe value={g.importe} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleEliminarGasto(g.id)}
                        disabled={loadingId === g.id}
                        className="text-slate-200 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {loadingId === g.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {showGastoForm && (
                  <tr className="bg-blue-50/40">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={gastoDesc}
                        onChange={e => setGastoDesc(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGuardarGasto()}
                        placeholder="Concepto del egreso..."
                        autoFocus
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ImporteInput
                        value={gastoImporte}
                        onChange={v => setGastoImporte(v)}
                        placeholder="0,00"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-right font-bold focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={handleGuardarGasto}
                        disabled={savingGasto || !gastoDesc.trim() || gastoImporte <= 0}
                        className="rounded-lg bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 transition-colors disabled:opacity-40"
                      >
                        {savingGasto ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-100">
                  <td colSpan={3} className="px-4 py-3">
                    <button
                      onClick={() => setShowGastoForm(v => !v)}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-semibold transition-colors',
                        showGastoForm ? 'text-slate-400 hover:text-slate-600' : 'text-blue-600 hover:text-blue-800'
                      )}
                    >
                      <Plus size={13} />
                      {showGastoForm ? 'Cancelar' : 'Agregar egreso'}
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
