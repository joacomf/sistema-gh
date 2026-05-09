// src/app/dashboard/ventas/VentasPageClient.tsx
"use client"

import { useState, useRef, useCallback } from 'react'
import { Search, Loader2, Check } from 'lucide-react'
import { Carrito, CarritoItem } from '@/modules/ventas/components/Carrito'
import { SelectorMetodoPago, MetodoPago } from '@/modules/ventas/components/SelectorMetodoPago'
import { ModalReposicion } from '@/modules/ventas/components/ModalReposicion'
import { checkoutAction, crearPedidosAction } from '@/modules/ventas/actions'
import { Importe } from '@/components/ui/ImporteInput'
import { cn } from '@/lib/utils'

type StockResult = {
  id: string
  codigo: string
  descripcion: string
  precioVenta: number
  cantidadSugerida: number
  proveedor: { nombre: string }
}

type ReposicionItem = { stockId: string; descripcion: string; cantidadSugerida: number }

export default function VentasPageClient({ recargo }: { recargo: number }) {
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO')
  const [facturada, setFacturada] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<StockResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reposicionItems, setReposicionItems] = useState<ReposicionItem[] | null>(null)
  const [reposicionLoading, setReposicionLoading] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const baseTotal = carrito.reduce((acc, i) => acc + i.subtotal, 0)
  const total = metodoPago === 'CREDITO' ? baseTotal * (1 + recargo / 100) : baseTotal

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setSuggestions([])
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!value.trim() || value.length < 2) return
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock/search?codigo=${encodeURIComponent(value)}`)
        const data = res.ok ? await res.json() : []
        setSuggestions(data.slice(0, 8))
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const addToCarrito = (stock: StockResult) => {
    setCarrito(prev => {
      const existing = prev.find(i => i.stockId === stock.id)
      if (existing) {
        return prev.map(i => i.stockId === stock.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioUnitario }
          : i
        )
      }
      return [...prev, {
        stockId: stock.id,
        codigo: stock.codigo,
        descripcion: stock.descripcion,
        cantidad: 1,
        precioUnitario: stock.precioVenta,
        subtotal: stock.precioVenta,
      }]
    })
    setQuery('')
    setSuggestions([])
    searchRef.current?.focus()
  }

  const updateCantidad = (stockId: string, cantidad: number) => {
    setCarrito(prev => prev.map(i =>
      i.stockId === stockId
        ? { ...i, cantidad, subtotal: cantidad * i.precioUnitario }
        : i
    ))
  }

  const removeItem = (stockId: string) => {
    setCarrito(prev => prev.filter(i => i.stockId !== stockId))
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      addToCarrito(suggestions[0])
    }
  }

  const handleFinalize = async () => {
    if (carrito.length === 0) return
    setLoading(true)
    try {
      const result = await checkoutAction({
        carrito,
        metodoPago,
        facturada,
        recargo,
      })
      if (result.success && result.data) {
        setReposicionItems(result.data.reposicion)
        setCarrito([])
        setFacturada(false)
        setMetodoPago('EFECTIVO')
      } else {
        alert(result.error ?? 'Error al registrar la venta')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReposicionConfirm = async (pedidos: { stockId: string; cantidad: number }[]) => {
    setReposicionLoading(true)
    try {
      await crearPedidosAction(pedidos)
    } finally {
      setReposicionLoading(false)
      setReposicionItems(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Punto de Venta</h1>
        <p className="mt-1 text-slate-500">Buscá artículos para agregar a la venta.</p>
      </div>

      {/* Buscador — mismo estilo que Recepción */}
      <div className="relative mb-4">
        <div className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.1)] transition-all shadow-sm">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscá por código o descripción..."
            className="flex-1 bg-transparent border-none outline-none text-base font-medium text-slate-900 placeholder:text-slate-400"
            autoComplete="off"
            autoFocus
          />
          {searching && <Loader2 size={16} className="animate-spin text-slate-400 shrink-0" />}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
            {suggestions.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCarrito(item)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 transition-colors text-left',
                  idx === 0 ? 'bg-blue-50' : 'hover:bg-blue-50'
                )}
              >
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{item.descripcion}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{item.codigo}</p>
                </div>
                <span className="text-sm font-bold text-blue-700 shrink-0 ml-4">
                  <Importe value={item.precioVenta} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
        {/* Panel izquierdo — carrito */}
        <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm p-6 min-h-64">
          <Carrito items={carrito} onUpdateCantidad={updateCantidad} onRemove={removeItem} />
        </div>

        {/* Panel derecho — pago y total */}
        <div className="sticky top-6 rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm p-6 space-y-5">
          <SelectorMetodoPago value={metodoPago} onChange={setMetodoPago} recargo={recargo} />

          {/* Total */}
          <div className="rounded-xl bg-slate-50 px-4 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Total a cobrar
            </p>
            <p className="text-4xl font-black text-slate-900 font-mono">
              <Importe value={total} />
            </p>
            {metodoPago === 'CREDITO' && (
              <p className="text-xs text-amber-600 mt-1">
                inc. recargo +<Importe value={total - baseTotal} />
              </p>
            )}
          </div>

          {/* Facturada */}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={facturada}
              onChange={e => setFacturada(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Marcar como facturada
          </label>

          {/* Acciones */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleFinalize}
              disabled={loading || carrito.length === 0}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-4 py-4 text-base font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-emerald-600 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {loading ? 'Registrando...' : 'Finalizar venta'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de reposición post-checkout */}
      {reposicionItems && (
        <ModalReposicion
          items={reposicionItems}
          onConfirm={handleReposicionConfirm}
          onSkip={() => setReposicionItems(null)}
          loading={reposicionLoading}
        />
      )}
    </div>
  )
}
