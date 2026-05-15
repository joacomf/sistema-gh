"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, Search, X, Box } from "lucide-react"
import CajasList from "@/modules/cajas/components/CajasList"
import CajaForm from "@/modules/cajas/components/CajaForm"
import ArticulosDeCaja from "@/modules/cajas/components/ArticulosDeCaja"
import AsignarArticuloModal from "@/modules/cajas/components/AsignarArticuloModal"

type Caja = {
  id: string
  nombre: string
  ubicacion: string
  _count: { stocks: number }
}

type StockItem = {
  stockId: string
  stock: {
    id: string
    codigo: string
    descripcion: string
    cantidad: number
    proveedor: { nombre: string }
  }
}

type CajaWithStocks = {
  id: string
  nombre: string
  ubicacion: string
  stocks: StockItem[]
}

export default function CajasPageClient({
  cajas,
  cajaSeleccionada,
  initialQ,
  initialCajaId,
}: {
  cajas: Caja[]
  cajaSeleccionada: CajaWithStocks | null
  initialQ: string
  initialCajaId: string | null
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null)
  const [isAsignarOpen, setIsAsignarOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => { setQ(initialQ) }, [initialQ])

  function navigate(updates: { q?: string; cajaId?: string | null }) {
    const params = new URLSearchParams()
    const nextQ = updates.q !== undefined ? updates.q : q
    const nextCajaId = updates.cajaId !== undefined ? updates.cajaId : initialCajaId
    if (nextQ) params.set("q", nextQ)
    if (nextCajaId) params.set("cajaId", nextCajaId)
    router.push(`/dashboard/cajas?${params.toString()}`)
  }

  const handleQChange = (value: string) => {
    setQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate({ q: value }), 400)
  }

  const handleOpenNew = () => { setEditingCaja(null); setIsFormOpen(true) }
  const handleOpenEdit = (caja: Caja) => { setEditingCaja(caja); setIsFormOpen(true) }
  const handleFormClose = () => { setIsFormOpen(false); setEditingCaja(null); router.refresh() }

  return (
    <div className="flex h-full gap-0 -m-6 min-h-[calc(100vh-4rem)]">
      {/* Panel izquierdo: lista de cajas */}
      <div className="w-72 shrink-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Cajas</h2>
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-1 rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              <Plus size={13} />
              Nueva
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar caja o artículo..."
              value={q}
              onChange={e => handleQChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <CajasList
            cajas={cajas}
            selectedId={initialCajaId}
            onSelect={id => navigate({ cajaId: id })}
            onEdit={handleOpenEdit}
          />
        </div>
      </div>

      {/* Panel derecho: artículos de la caja seleccionada */}
      <div className="flex-1 overflow-y-auto p-6">
        {cajaSeleccionada ? (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">{cajaSeleccionada.nombre}</h2>
              <p className="text-sm text-slate-500">{cajaSeleccionada.ubicacion}</p>
            </div>
            <ArticulosDeCaja
              cajaId={cajaSeleccionada.id}
              articulos={cajaSeleccionada.stocks}
              onAsignar={() => setIsAsignarOpen(true)}
            />
          </>
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center">
            <div className="text-center">
              <Box size={48} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400">Seleccioná una caja para ver sus artículos</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear/editar caja */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {editingCaja ? "Editar caja" : "Nueva caja"}
              </Dialog.Title>
              <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="px-6 py-5">
              <CajaForm key={editingCaja?.id ?? "new"} caja={editingCaja} onSuccess={handleFormClose} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal asignar artículo */}
      {cajaSeleccionada && (
        <AsignarArticuloModal
          cajaId={cajaSeleccionada.id}
          open={isAsignarOpen}
          onClose={() => setIsAsignarOpen(false)}
        />
      )}
    </div>
  )
}
