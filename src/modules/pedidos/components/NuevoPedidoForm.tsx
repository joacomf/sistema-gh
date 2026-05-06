"use client"

import { useState, useEffect, useRef } from "react"
import { createRepuestoPedidoAction } from "../actions"
import { Search, Loader2 } from "lucide-react"

export default function NuevoPedidoForm({ onSuccess }: { onSuccess: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [cantidad, setCantidad] = useState(1)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim() || selectedStock) {
      setResults([])
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/stock/search?codigo=${encodeURIComponent(query)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, selectedStock])

  const handleSelect = (item: any) => {
    setSelectedStock(item)
    setQuery(`${item.codigo} — ${item.descripcion}`)
    setCantidad(item.cantidadSugerida > 0 ? item.cantidadSugerida : 1)
    setResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStock) return
    setLoading(true)
    try {
      const result = await createRepuestoPedidoAction({ stockId: selectedStock.id, cantidad })
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
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Repuesto <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedStock(null) }}
            placeholder="Buscar por código o descripción..."
            className="block w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            required
          />
          {searching && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
        {results.length > 0 && (
          <div className="mt-1 rounded-lg border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto relative z-10">
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <span className="font-semibold text-slate-900">{item.codigo}</span>
                {item.codigoOriginal && (
                  <span className="text-slate-400 ml-1.5 text-xs">({item.codigoOriginal})</span>
                )}
                <span className="text-slate-500 ml-2">— {item.descripcion}</span>
                <span className="text-slate-400 ml-2 text-xs">{item.proveedor?.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Cantidad <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min={1}
          required
          value={cantidad}
          onChange={e => setCantidad(Number(e.target.value))}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
        {selectedStock?.cantidadSugerida > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            Cantidad sugerida: {selectedStock.cantidadSugerida}
          </p>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading || !selectedStock}
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Agregar a la lista"}
        </button>
      </div>
    </form>
  )
}
