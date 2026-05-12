import { getStockAction } from "@/modules/stock/actions"
import { getProveedoresAction } from "@/modules/proveedores/actions"
import StockPageClient from "./StockPageClient"

type SearchParams = Promise<{
  page?: string
  proveedorId?: string
  codigo?: string
}>

export default async function StockPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const proveedorId = params.proveedorId ?? ""
  const codigo = params.codigo ?? ""

  const [{ data: stock, total, pages }, proveedores] = await Promise.all([
    getStockAction({
      page,
      proveedorId: proveedorId || undefined,
      codigo: codigo || undefined,
    }),
    getProveedoresAction(),
  ])

  return (
    <StockPageClient
      stock={stock}
      total={total}
      pages={pages}
      currentPage={page}
      proveedores={proveedores}
      initialProveedorId={proveedorId}
      initialCodigo={codigo}
    />
  )
}
