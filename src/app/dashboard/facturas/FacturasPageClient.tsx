"use client"

import FacturasList from "@/modules/facturas/components/FacturasList"

export default function FacturasPageClient({ initialResult }: { initialResult: any }) {
  const { data: facturas = [], total = 0 } = initialResult
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
      <FacturasList facturas={facturas} />
    </div>
  )
}
