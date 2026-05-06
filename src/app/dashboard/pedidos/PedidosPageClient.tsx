"use client"

import { useState } from "react"
import RepuestosAPedir from "@/modules/pedidos/components/RepuestosAPedir"
import RepuestosPedidos from "@/modules/pedidos/components/RepuestosPedidos"
import NuevoPedidoForm from "@/modules/pedidos/components/NuevoPedidoForm"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, X } from "lucide-react"

export default function PedidosPageClient({
  aPedir,
  pedidos,
}: {
  aPedir: any[]
  pedidos: any[]
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-10">
      {/* Repuestos a pedir */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Repuestos a pedir</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {aPedir.length === 0
                ? "Sin repuestos pendientes"
                : `${aPedir.length} repuesto${aPedir.length !== 1 ? "s" : ""} por pedir`}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus size={18} />
            Agregar
          </button>
        </div>
        <RepuestosAPedir items={aPedir} />
      </div>

      {/* Repuestos pedidos */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Repuestos pedidos</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pedidos.length === 0
              ? "Sin pedidos en curso"
              : `${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""} en curso`}
          </p>
        </div>
        <RepuestosPedidos items={pedidos} />
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                Agregar repuesto a pedir
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <div className="px-6 py-5">
              <NuevoPedidoForm onSuccess={() => setIsModalOpen(false)} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
