import { getProveedoresAction } from "@/modules/proveedores/actions"
import RecepcionPageClient from "./RecepcionPageClient"

export default async function RecepcionPage() {
  const proveedores = await getProveedoresAction()
  return <RecepcionPageClient proveedores={proveedores} />
}
