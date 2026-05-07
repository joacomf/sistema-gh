"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Barcode, Loader2, Trash2, PackageOpen, Check } from "lucide-react"
import { createFacturaAction } from "@/modules/facturas/actions"
import ImporteInput from "@/components/ui/ImporteInput"
import { useRouter } from "next/navigation"

type StockResult = {
  id: string
  codigo: string
  descripcion: string
  proveedor: { nombre: string }
}

type ItemRow = {
  stockId: string
  codigo: string
  descripcion: string
  cantidad: number
}

type Proveedor = {
  id: string
  nombre: string
}

export default function RecepcionPageClient({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter()
  const [proveedorId, setProveedorId] = useState("")
  const [numero, setNumero] = useState("")
  const [importe, setImporte] = useState<number | "">("")
  const [items, setItems] = useState<ItemRow[]>([])
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<StockResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const quantityRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const pendingFocusId = useRef<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // After items update, focus and select the quantity input for the just-added item
  useEffect(() => {
    if (pendingFocusId.current) {
      const input = quantityRefs.current[pendingFocusId.current]
      if (input) {
        input.focus()
        input.select()
        pendingFocusId.current = null
      }
    }
  }, [items])

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setSuggestions([])
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!value.trim() || value.length < 2) return
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ codigo: value })
        if (proveedorId) params.set("proveedorId", proveedorId)
        const res = await fetch(`/api/stock/search?${params}`)
        const data = res.ok ? await res.json() : []
        setSuggestions(data)
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [proveedorId])

  const addItem = (stock: StockResult) => {
    pendingFocusId.current = stock.id
    setItems(prev => {
      const existing = prev.find(i => i.stockId === stock.id)
      if (existing) {
        return prev.map(i =>
          i.stockId === stock.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, {
        stockId: stock.id,
        codigo: stock.codigo,
        descripcion: stock.descripcion,
        cantidad: 1,
      }]
    })
    setQuery("")
    setSuggestions([])
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault()
      addItem(suggestions[0])
    }
  }

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      searchRef.current?.focus()
    }
  }

  const updateCantidad = (stockId: string, cantidad: number) => {
    setItems(prev =>
      prev.map(i => i.stockId === stockId ? { ...i, cantidad: Math.max(1, cantidad) } : i)
    )
  }

  const removeItem = (stockId: string) => {
    setItems(prev => prev.filter(i => i.stockId !== stockId))
  }

  const handleSubmit = async () => {
    if (!proveedorId) { alert("Seleccioná un proveedor"); return }
    if (!numero.trim()) { alert("Ingresá el número de factura o remito"); return }
    if (items.length === 0) { alert("Agregá al menos un artículo"); return }
    if (!importe || Number(importe) <= 0) {
      if (!confirm("El importe es $0. ¿Confirmar el ingreso de todas formas?")) return
    }

    setLoading(true)
    try {
      const result = await createFacturaAction({
        proveedorId,
        numero,
        importe: Number(importe) || 0,
        items: items.map(i => ({ stockId: i.stockId, cantidad: i.cantidad })),
      })
      if (result.success) {
        router.push("/dashboard/facturas")
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Recepción de mercadería</h1>
        <p className="mt-1 text-slate-500">Registrá el ingreso de repuestos de un proveedor.</p>
      </div>

      {/* Buscador — fuera de los paneles */}
      <div className="relative mb-4">
        <div className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.1)] transition-all shadow-sm">
          <Barcode size={20} className="text-slate-400 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Escaneá o buscá por código / descripción..."
            className="flex-1 bg-transparent border-none outline-none text-base font-medium text-slate-900 placeholder:text-slate-400"
            autoComplete="off"
            autoFocus
          />
          {searching && (
            <Loader2 size={16} className="animate-spin text-slate-400 shrink-0" />
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
            {suggestions.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item)}
                className={`w-full flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 transition-colors text-left ${idx === 0 ? "bg-blue-50" : "hover:bg-blue-50"}`}
              >
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{item.descripcion}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{item.codigo}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-4">
                  {item.proveedor?.nombre}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
        {/* Panel izquierdo */}
        <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ingreso de Repuestos</h2>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <PackageOpen size={48} className="mb-4 opacity-50" />
              <p className="text-sm">No hay artículos cargados en este ingreso.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 w-1/5">Código</th>
                  <th className="pb-3 pl-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Descripción</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 w-1/5">Cantidad</th>
                  <th className="pb-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.stockId}>
                    <td className="py-4 font-mono font-semibold text-sm text-slate-900">
                      {item.codigo}
                    </td>
                    <td className="py-4 pl-4 text-sm text-slate-600">{item.descripcion}</td>
                    <td className="py-4 text-center">
                      <input
                        ref={el => { quantityRefs.current[item.stockId] = el }}
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={e => updateCantidad(item.stockId, Number(e.target.value))}
                        onKeyDown={handleQuantityKeyDown}
                        className="w-16 text-center font-bold text-sm border border-slate-200 rounded-lg py-1.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </td>
                    <td className="py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.stockId)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel derecho — sticky */}
        <div className="sticky top-6 rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-5">
            Datos de Factura
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Proveedor
              </label>
              <select
                value={proveedorId}
                onChange={e => setProveedorId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              >
                <option value="">Seleccionar...</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Nro. Factura / Remito
              </label>
              <input
                type="text"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="Ej: 0001-000432"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Total Facturado ($)
              </label>
              <ImporteInput
                value={Number(importe) || 0}
                onChange={v => setImporte(v)}
                placeholder="0,00"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Monto final que figura en la factura.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-4 py-4 text-base font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-emerald-600 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <Check size={18} />}
            {loading ? "Guardando..." : "Confirmar Ingreso"}
          </button>
        </div>
      </div>
    </div>
  )
}
