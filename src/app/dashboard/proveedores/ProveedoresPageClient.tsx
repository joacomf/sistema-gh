"use client"

import { useState } from "react"
import ProveedoresList from "@/modules/proveedores/components/ProveedoresList"
import ProveedorForm from "@/modules/proveedores/components/ProveedorForm"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, X } from "lucide-react"

export default function ProveedoresPageClient({ initialProveedores }: { initialProveedores: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<any>(null)

  const handleOpenNew = () => {
    setSelectedProveedor(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (proveedor: any) => {
    setSelectedProveedor(proveedor)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedProveedor(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
          <p className="mt-1 text-slate-500">
            {initialProveedores.length === 0
              ? "Sin proveedores registrados"
              : `${initialProveedores.length} proveedor${initialProveedores.length !== 1 ? "es" : ""} registrado${initialProveedores.length !== 1 ? "s" : ""}`
            }
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus size={18} />
          Nuevo proveedor
        </button>
      </div>

      <ProveedoresList proveedores={initialProveedores} onEdit={handleOpenEdit} />

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {selectedProveedor ? "Editar proveedor" : "Nuevo proveedor"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <div className="px-6 py-5">
              <ProveedorForm proveedor={selectedProveedor} onSuccess={handleClose} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
