import { getFacturasAction } from "@/modules/facturas/actions"
import FacturasPageClient from "./FacturasPageClient"

export default async function FacturasPage() {
  const facturas = await getFacturasAction()
  return <FacturasPageClient initialFacturas={facturas} />
}
