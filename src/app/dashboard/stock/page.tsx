import { getStockAction } from "@/modules/stock/actions"
import { getProveedoresAction } from "@/modules/proveedores/actions"
import StockPageClient from "./StockPageClient"

export default async function StockPage() {
  const stockResult = await getStockAction()
  const proveedores = await getProveedoresAction()

  return <StockPageClient initialStock={stockResult.data} proveedores={proveedores} />
}
