"use client"

import { useState, useEffect } from "react"
import StockList from "@/modules/stock/components/StockList"
import StockForm from "@/modules/stock/components/StockForm"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, X, Search, Loader2 } from "lucide-react"

export default function StockPageClient({
  initialStock,
  proveedores
}: {
  initialStock: any[],
  proveedores: any[]
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [filteredStock, setFilteredStock] = useState(initialStock)
  const [searchProveedorId, setSearchProveedorId] = useState("")
  const [searchCodigo, setSearchCodigo] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!searchProveedorId && !searchCodigo) {
      setFilteredStock(initialStock)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams()
        if (searchProveedorId) params.set("proveedorId", searchProveedorId)
        if (searchCodigo) params.set("codigo", searchCodigo)

        const res = await fetch(`/api/stock/search?${params}`)
        if (res.ok) setFilteredStock(await res.json())
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchProveedorId, searchCodigo, initialStock])

  // Sync with fresh server data when no search is active
  useEffect(() => {
    if (!searchProveedorId && !searchCodigo) {
      setFilteredStock(initialStock)
    }
  }, [initialStock]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenNew = () => {
    setSelectedStock(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (stockItem: any) => {
    setSelectedStock(stockItem)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedStock(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock</h1>
          <p className="mt-1 text-slate-500">
            {initialStock.length === 0
              ? "Sin piezas registradas"
              : `${initialStock.length} pieza${initialStock.length !== 1 ? "s" : ""} en inventario`
            }
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus size={18} />
          Nueva pieza
        </button>
      </div>

      {/* Buscador */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={searchProveedorId}
          onChange={e => setSearchProveedorId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p: any) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Código..."
            value={searchCodigo}
            onChange={e => setSearchCodigo(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-72"
          />
        </div>

        {isSearching && <Loader2 size={15} className="animate-spin text-slate-400" />}
      </div>

      <StockList stock={filteredStock} onEdit={handleOpenEdit} />

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {selectedStock ? "Editar pieza" : "Nueva pieza"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <div className="px-6 py-5">
              <StockForm
                stock={selectedStock}
                proveedores={proveedores}
                onSuccess={handleClose}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
