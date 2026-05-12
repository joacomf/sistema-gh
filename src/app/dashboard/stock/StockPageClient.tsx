"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import StockList from "@/modules/stock/components/StockList"
import StockForm from "@/modules/stock/components/StockForm"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, X, Search, ChevronLeft, ChevronRight } from "lucide-react"

export default function StockPageClient({
  stock,
  total,
  pages,
  currentPage,
  proveedores,
  initialProveedorId,
  initialCodigo,
}: {
  stock: any[]
  total: number
  pages: number
  currentPage: number
  proveedores: any[]
  initialProveedorId: string
  initialCodigo: string
}) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [proveedorId, setProveedorId] = useState(initialProveedorId)
  const [codigo, setCodigo] = useState(initialCodigo)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => { setProveedorId(initialProveedorId) }, [initialProveedorId])
  useEffect(() => { setCodigo(initialCodigo) }, [initialCodigo])

  function navigate(updates: { proveedorId?: string; codigo?: string; page?: string }) {
    const params = new URLSearchParams()
    const nextProveedorId = updates.proveedorId !== undefined ? updates.proveedorId : proveedorId
    const nextCodigo = updates.codigo !== undefined ? updates.codigo : codigo
    const nextPage = updates.page ?? "1"

    if (nextProveedorId) params.set("proveedorId", nextProveedorId)
    if (nextCodigo) params.set("codigo", nextCodigo)
    if (Number(nextPage) > 1) params.set("page", nextPage)

    router.push(`/dashboard/stock?${params.toString()}`)
  }

  const handleCodigoChange = (value: string) => {
    setCodigo(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ codigo: value, page: "1" })
    }, 400)
  }

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
            {total === 0
              ? "Sin piezas registradas"
              : `${total} pieza${total !== 1 ? "s" : ""} en inventario`}
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

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={proveedorId}
          onChange={e => {
            setProveedorId(e.target.value)
            navigate({ proveedorId: e.target.value, page: "1" })
          }}
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
            value={codigo}
            onChange={e => handleCodigoChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-72"
          />
        </div>
      </div>

      <StockList stock={stock} onEdit={handleOpenEdit} />

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Página {currentPage} de {pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={15} />
              Anterior
            </button>
            <button
              onClick={() => navigate({ page: String(currentPage + 1) })}
              disabled={currentPage >= pages}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Siguiente
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

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
