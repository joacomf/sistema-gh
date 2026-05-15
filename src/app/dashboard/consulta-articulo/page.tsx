import { searchStockConCajasAction, getStockConCajasAction } from "@/modules/consulta-articulo/actions"
import ConsultaArticuloPageClient from "./ConsultaArticuloPageClient"

type SearchParams = Promise<{ q?: string; id?: string }>

export default async function ConsultaArticuloPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = params.q ?? ""
  const id = params.id ?? ""

  const [searchResult, detailResult] = await Promise.all([
    q ? searchStockConCajasAction(q) : Promise.resolve({ success: true as const, data: [] }),
    id ? getStockConCajasAction(id) : Promise.resolve({ success: true as const, data: null }),
  ])

  const resultados = searchResult.success ? searchResult.data ?? [] : []
  const articulo = detailResult.success ? detailResult.data ?? null : null

  return (
    <ConsultaArticuloPageClient
      resultados={resultados}
      articulo={articulo}
      initialQ={q}
      initialId={id}
    />
  )
}
