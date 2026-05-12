import { getFacturasAction } from "@/modules/facturas/actions"
import { getProveedoresAction } from "@/modules/proveedores/actions"
import FacturasPageClient from "./FacturasPageClient"

type SearchParams = Promise<{
  page?: string
  proveedorId?: string
  numero?: string
}>

export default async function FacturasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const proveedorId = params.proveedorId ?? ""
  const numero = params.numero ?? ""

  const [{ data: facturas, total, pages }, proveedores] = await Promise.all([
    getFacturasAction({
      page,
      proveedorId: proveedorId || undefined,
      numero: numero || undefined,
    }),
    getProveedoresAction(),
  ])

  return (
    <FacturasPageClient
      facturas={facturas}
      total={total}
      pages={pages}
      currentPage={page}
      proveedores={proveedores}
      initialProveedorId={proveedorId}
      initialNumero={numero}
    />
  )
}
