"use client"

import { useState, useEffect, useRef } from "react"
import { createFacturaAction } from "../actions"
import { Plus, X, Search, Loader2 } from "lucide-react"

type ItemRow = {
  id: number
  stockId: string
  stockLabel: string
  cantidad: number
  query: string
  results: any[]
  searching: boolean
}

function emptyRow(id: number): ItemRow {
  return { id, stockId: "", stockLabel: "", cantidad: 1, query: "", results: [], searching: false }
}

export default function FacturaForm({ onSuccess }: { onSuccess: () => void }) {
  const [numero, setNumero] = useState("")
  const [importe, setImporte] = useState<number | "">("")
  const [rows, setRows] = useState<ItemRow[]>([emptyRow(0)])
  const [loading, setLoading] = useState(false)
  const nextId = useRef(1)
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  const updateRow = (id: number, patch: Partial<ItemRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const handleQueryChange = (id: number, query: string) => {
    updateRow(id, { query, stockId: "", stockLabel: "", results: [] })
    if (timers.current[id]) clearTimeout(timers.current[id])
    if (!query.trim()) return
    updateRow(id, { searching: true })
    timers.current[id] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock/search?codigo=${encodeURIComponent(query)}`)
        const data = res.ok ? await res.json() : []
        updateRow(id, { results: data, searching: false })
      } catch {
        updateRow(id, { searching: false })
      }
    }, 400)
  }

  const handleSelectStock = (id: number, item: any) => {
    updateRow(id, {
      stockId: item.id,
      stockLabel: `${item.codigo} — ${item.descripcion}`,
      query: `${item.codigo} — ${item.descripcion}`,
      results: [],
      searching: false,
    })
  }

  const addRow = () => {
    setRows(prev => [...prev, emptyRow(nextId.current++)])
  }

  const removeRow = (id: number) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rows.some(r => !r.stockId)) {
      alert("Seleccione un repuesto para cada ítem de la factura")
      return
    }
    setLoading(true)
    try {
      const result = await createFacturaAction({
        numero,
        importe: Number(importe),
        items: rows.map(r => ({ stockId: r.stockId, cantidad: r.cantidad })),
      })
      if (result.success) {
        onSuccess()
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Número de factura <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder="Ej: 0001-00012345"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Importe total <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={importe}
            onChange={e => setImporte(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="0.00"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700">Ítems recibidos</span>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Plus size={15} />
            Agregar ítem
          </button>
        </div>

        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.id} className="flex gap-2 items-start">
              <div className="flex-1 relative">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={row.query}
                    onChange={e => handleQueryChange(row.id, e.target.value)}
                    placeholder="Código o descripción del repuesto..."
                    className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                  {row.searching && (
                    <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>
                {row.results.length > 0 && (
                  <div className="absolute left-0 right-0 mt-0.5 rounded-lg border border-slate-200 bg-white shadow-lg max-h-44 overflow-y-auto z-20">
                    {row.results.map((item: any) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectStock(row.id, item)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <span className="font-semibold text-slate-900">{item.codigo}</span>
                        <span className="text-slate-500 ml-2">— {item.descripcion}</span>
                        <span className="text-slate-400 ml-2 text-xs">{item.proveedor?.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="number"
                min={1}
                value={row.cantidad}
                onChange={e => updateRow(row.id, { cantidad: Number(e.target.value) })}
                placeholder="Cant."
                className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />

              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-30 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {loading ? "Registrando..." : "Registrar factura"}
        </button>
      </div>
    </form>
  )
}
