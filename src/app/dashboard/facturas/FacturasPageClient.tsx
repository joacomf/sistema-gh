"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import FacturasList from "@/modules/facturas/components/FacturasList"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

export default function FacturasPageClient({
  facturas,
  total,
  pages,
  currentPage,
  proveedores,
  initialProveedorId,
  initialNumero,
}: {
  facturas: any[]
  total: number
  pages: number
  currentPage: number
  proveedores: any[]
  initialProveedorId: string
  initialNumero: string
}) {
  const router = useRouter()
  const [proveedorId, setProveedorId] = useState(initialProveedorId)
  const [numero, setNumero] = useState(initialNumero)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => { setProveedorId(initialProveedorId) }, [initialProveedorId])
  useEffect(() => { setNumero(initialNumero) }, [initialNumero])

  function navigate(updates: { proveedorId?: string; numero?: string; page?: string }) {
    const params = new URLSearchParams()
    const nextProveedorId = updates.proveedorId !== undefined ? updates.proveedorId : proveedorId
    const nextNumero = updates.numero !== undefined ? updates.numero : numero
    const nextPage = updates.page ?? "1"

    if (nextProveedorId) params.set("proveedorId", nextProveedorId)
    if (nextNumero) params.set("numero", nextNumero)
    if (Number(nextPage) > 1) params.set("page", nextPage)

    router.push(`/dashboard/facturas?${params.toString()}`)
  }

  const handleNumeroChange = (value: string) => {
    setNumero(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ numero: value, page: "1" })
    }, 400)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
        <p className="mt-1 text-slate-500">
          {total === 0
            ? "Sin facturas registradas"
            : `${total} factura${total !== 1 ? "s" : ""} registrada${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={proveedorId}
          onChange={e => {
            setProveedorId(e.target.value)
            navigate({ proveedorId: e.target.value, page: "1" })
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p: any) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Número de factura..."
            value={numero}
            onChange={e => handleNumeroChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-56"
          />
        </div>
      </div>

      <FacturasList facturas={facturas} />

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Página {currentPage} de {pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={15} />
              Anterior
            </button>
            <button
              onClick={() => navigate({ page: String(currentPage + 1) })}
              disabled={currentPage >= pages}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Siguiente
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
