"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { createRepuestoPedidoAction } from "@/modules/pedidos/actions"
import RepuestosAPedir from "@/modules/pedidos/components/RepuestosAPedir"
import RepuestosPedidos from "@/modules/pedidos/components/RepuestosPedidos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Search, Loader2, Plus } from "lucide-react"

export default function PedidosPageClient({
  aPedir,
  pedidos,
  proveedores,
}: {
  aPedir: any[]
  pedidos: any[]
  proveedores: any[]
}) {
  const [searchProveedorId, setSearchProveedorId] = useState("")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [cantidad, setCantidad] = useState(1)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
        const params = new URLSearchParams({ codigo: query })
        if (searchProveedorId) params.set("proveedorId", searchProveedorId)
        const res = await fetch(`/api/stock/search?${params}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, selectedStock, searchProveedorId])

  const handleSelect = (item: any) => {
    setSelectedStock(item)
    setQuery(item.codigo)
    setCantidad(item.cantidadSugerida > 0 ? item.cantidadSugerida : 1)
    setResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStock) return
    setLoading(true)
    setError(null)
    try {
      const result = await createRepuestoPedidoAction({ stockId: selectedStock.id, cantidad })
      if (result.success) {
        setSelectedStock(null)
        setQuery("")
        setCantidad(1)
      } else {
        setError(result.error ?? "Error al agregar el repuesto")
      }
    } finally {
      setLoading(false)
    }
  }

  const filterCodigo = selectedStock ? selectedStock.codigo : query
  const filteredAPedir = useMemo(() =>
    aPedir.filter(item => {
      const matchProveedor = !searchProveedorId || item.stock.proveedorId === searchProveedorId
      const q = filterCodigo.toLowerCase()
      const matchCodigo = !q ||
        item.stock.codigo.toLowerCase().includes(q) ||
        item.stock.descripcion.toLowerCase().includes(q)
      return matchProveedor && matchCodigo
    }), [aPedir, searchProveedorId, filterCodigo])

  return (
    <div className="space-y-10">
      {/* Formulario inline */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Agregar repuesto</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Proveedor</label>
            <select
              value={searchProveedorId}
              onChange={e => { setSearchProveedorId(e.target.value); setSelectedStock(null) }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-48"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="text-xs font-medium text-slate-600">Código / Descripción</label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedStock(null) }}
                placeholder="Buscar..."
                className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-64"
              />
              {searching && (
                <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>
            {results.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-10 w-full min-w-[320px] rounded-lg border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-semibold text-slate-900">{item.codigo}</span>
                    <span className="text-slate-500 ml-2">— {item.descripcion}</span>
                    <span className="text-slate-400 ml-2 text-xs">{item.proveedor?.nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Cantidad</label>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={e => setCantidad(Math.max(1, Number(e.target.value)))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-24"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedStock}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Agregar
          </button>
        </form>
        {error && (
          <div className="mt-3">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}
      </div>

      {/* Artículos a pedir */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Artículos a pedir</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {filteredAPedir.length === 0
              ? "Sin repuestos pendientes"
              : `${filteredAPedir.length} repuesto${filteredAPedir.length !== 1 ? "s" : ""} por pedir`}
          </p>
        </div>
        <RepuestosAPedir items={filteredAPedir} />
      </div>

      {/* Pedidos en curso */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pedidos en curso</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pedidos.length === 0
              ? "Sin pedidos en curso"
              : `${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""} en curso`}
          </p>
        </div>
        <RepuestosPedidos items={pedidos} />
      </div>
    </div>
  )
}
