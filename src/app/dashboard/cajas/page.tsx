import { getCajasAction, getCajaByIdAction } from "@/modules/cajas/actions"
import CajasPageClient from "./CajasPageClient"

type SearchParams = Promise<{ q?: string; cajaId?: string }>

export default async function CajasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = params.q ?? ""
  const cajaId = params.cajaId ?? null

  const cajasResult = await getCajasAction(q)
  const cajas = cajasResult.success ? cajasResult.data ?? [] : []

  const cajaResult = cajaId ? await getCajaByIdAction(cajaId) : null
  const cajaSeleccionada = cajaResult?.success ? cajaResult.data ?? null : null

  return (
    <CajasPageClient
      cajas={cajas}
      cajaSeleccionada={cajaSeleccionada}
      initialQ={q}
      initialCajaId={cajaId}
    />
  )
}
