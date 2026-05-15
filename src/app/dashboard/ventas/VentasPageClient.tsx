"use client"

import { useState, useRef, useCallback } from 'react'
import { Search, Loader2, Check, Printer } from 'lucide-react'
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
  cantidad: number
  precioCosto: number
  precioVenta: number
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
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
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
        precioCosto: stock.precioCosto,
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

  const updatePrecio = (stockId: string, precio: number) => {
    setCarrito(prev => prev.map(i =>
      i.stockId === stockId
        ? { ...i, precioUnitario: precio, subtotal: i.cantidad * precio }
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

  const handleFinalize = async (print = false) => {
    if (carrito.length === 0) return
    setCheckoutError(null)
    setLoading(true)
    try {
      const result = await checkoutAction({ carrito, metodoPago, facturada, recargo })
      if (result.success && result.data) {
        if (print) {
          window.open(`/ticket/${result.data.ventaId}`, '_blank', 'width=420,height=680')
        }
        setReposicionItems(result.data.reposicion)
        setCarrito([])
        setFacturada(false)
        setMetodoPago('EFECTIVO')
      } else {
        setCheckoutError(result.error ?? 'Error al registrar la venta')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReposicionConfirm = async (pedidos: { stockId: string; cantidad: number }[]) => {
    setReposicionLoading(true)
    try {
      const result = await crearPedidosAction(pedidos)
      if (result.success) {
        setReposicionItems(null)
      } else {
        console.error('Error al crear pedidos:', result.error)
        setReposicionItems(null)
      }
    } finally {
      setReposicionLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Punto de Venta</h1>
        <p className="mt-1 text-slate-500">Buscá artículos para agregar a la venta.</p>
      </div>

      <div className="relative mb-6">
        <div className="flex items-center gap-4 bg-white border-[3px] border-blue-500 rounded-2xl px-5 py-4 shadow-[0_0_0_5px_rgba(37,99,235,0.1)] transition-all">
          <Search size={24} className="text-blue-500 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Escanear o buscar por número de pieza..."
            className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
            autoComplete="off"
            autoFocus
          />
          {searching && <Loader2 size={18} className="animate-spin text-blue-400 shrink-0" />}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
            {suggestions.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCarrito(item)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-50 last:border-0 transition-colors text-left',
                  idx === 0 ? 'bg-blue-50' : 'hover:bg-blue-50'
                )}
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-900 font-mono text-base leading-tight">{item.codigo}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.descripcion}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 ml-4">
                  <span className={cn(
                    'text-xs font-semibold rounded-full px-2.5 py-0.5 tabular-nums',
                    item.cantidad <= 0
                      ? 'bg-red-100 text-red-600'
                      : item.cantidad <= 3
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  )}>
                    {item.cantidad} en stock
                  </span>
                  <span className="text-sm font-bold text-blue-700">
                    <Importe value={item.precioVenta} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-6 items-start">
        <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm p-6 min-h-64">
          <Carrito
            items={carrito}
            onUpdateCantidad={updateCantidad}
            onUpdatePrecio={updatePrecio}
            onRemove={removeItem}
          />
        </div>

        <div className="sticky top-6 rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <SelectorMetodoPago value={metodoPago} onChange={setMetodoPago} recargo={recargo} />

          <div className="rounded-xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 text-center">
              Total a cobrar
            </p>
            <p className="text-2xl font-black text-slate-900 font-mono text-center leading-tight break-all">
              <Importe value={total} />
            </p>
            {metodoPago === 'CREDITO' && baseTotal > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200 space-y-0.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span><Importe value={baseTotal} /></span>
                </div>
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Recargo {recargo}%</span>
                  <span>+<Importe value={total - baseTotal} /></span>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={facturada}
              onChange={e => setFacturada(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Marcar como facturada
          </label>

          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleFinalize(false)}
                disabled={loading || carrito.length === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-emerald-600 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? 'Registrando...' : 'Finalizar'}
              </button>
              <button
                type="button"
                onClick={() => handleFinalize(true)}
                disabled={loading || carrito.length === 0}
                title="Finalizar e imprimir ticket"
                className="flex items-center justify-center rounded-xl bg-slate-700 px-4 py-3.5 text-white hover:bg-slate-800 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50"
              >
                <Printer size={16} />
              </button>
            </div>
            {checkoutError && (
              <p className="text-xs text-red-600 text-center">{checkoutError}</p>
            )}
          </div>
        </div>
      </div>

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
