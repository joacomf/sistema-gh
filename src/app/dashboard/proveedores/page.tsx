import { getProveedoresAction } from "@/modules/proveedores/actions"
import ProveedoresPageClient from "./ProveedoresPageClient"

export default async function ProveedoresPage() {
  const proveedores = await getProveedoresAction()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Proveedores</h1>
        <p className="text-gray-500">Gestiona los proveedores y sus descuentos.</p>
      </div>

      <ProveedoresPageClient initialProveedores={proveedores} />
    </div>
  )
}
