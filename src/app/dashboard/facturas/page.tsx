import { getFacturasAction } from "@/modules/facturas/actions"
import FacturasPageClient from "./FacturasPageClient"

export default async function FacturasPage() {
  const result = await getFacturasAction()
  return <FacturasPageClient initialResult={result} />
}
