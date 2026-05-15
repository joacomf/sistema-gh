"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Package } from "lucide-react"
import DetalleArticulo from "@/modules/consulta-articulo/components/DetalleArticulo"
import ResultadosBusqueda from "@/modules/consulta-articulo/components/ResultadosBusqueda"

export default function ConsultaArticuloPageClient({
  resultados,
  articulo,
  initialQ,
  initialId,
}: {
  resultados: any[]
  articulo: any | null
  initialQ: string
  initialId: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => { setQ(initialQ) }, [initialQ])

  function navigate(updates: { q?: string; id?: string }) {
    const params = new URLSearchParams()
    const nextQ = updates.q !== undefined ? updates.q : q
    const nextId = updates.id !== undefined ? updates.id : initialId
    if (nextQ) params.set("q", nextQ)
    if (nextId) params.set("id", nextId)
    router.push(`/dashboard/consulta-articulo?${params.toString()}`)
  }

  const handleQChange = (value: string) => {
    setQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate({ q: value, id: "" }), 400)
  }

  const displayedArticulo = articulo ?? (resultados.length === 1 ? resultados[0] : null)
  const showResults = !initialId && resultados.length > 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consulta de Artículo</h1>
        <p className="mt-1 text-slate-500">Buscá un artículo para ver su detalle completo</p>
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por código o descripción..."
          value={q}
          onChange={e => handleQChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-base placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
        />
      </div>

      {showResults && (
        <div>
          <p className="mb-3 text-sm text-slate-500">{resultados.length} resultados para &ldquo;{initialQ}&rdquo;</p>
          <ResultadosBusqueda resultados={resultados} onSelect={id => navigate({ id })} />
        </div>
      )}

      {displayedArticulo && <DetalleArticulo articulo={displayedArticulo} />}

      {!displayedArticulo && !showResults && initialQ && (
        <div className="py-16 text-center">
          <Package size={48} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400">Sin resultados para &ldquo;{initialQ}&rdquo;</p>
        </div>
      )}

      {!initialQ && (
        <div className="py-16 text-center">
          <Package size={48} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400">Ingresá un código o descripción para buscar</p>
        </div>
      )}
    </div>
  )
}
