import { getRepuestosAPedirAction, getRepuestosPedidosAction } from "@/modules/pedidos/actions"
import PedidosPageClient from "./PedidosPageClient"

export default async function PedidosPage() {
  const [aPedir, pedidos] = await Promise.all([
    getRepuestosAPedirAction(),
    getRepuestosPedidosAction(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
        <p className="mt-1 text-slate-500">Administrá los repuestos a pedir y los pedidos en curso.</p>
      </div>
      <PedidosPageClient aPedir={aPedir} pedidos={pedidos} />
    </div>
  )
}
