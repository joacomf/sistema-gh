"use client"

import FacturasList from "@/modules/facturas/components/FacturasList"

export default function FacturasPageClient({ initialFacturas }: { initialFacturas: any[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
        <p className="mt-1 text-slate-500">
          {initialFacturas.length === 0
            ? "Sin facturas registradas"
            : `${initialFacturas.length} factura${initialFacturas.length !== 1 ? "s" : ""} registrada${initialFacturas.length !== 1 ? "s" : ""}`}
        </p>
      </div>
      <FacturasList facturas={initialFacturas} />
    </div>
  )
}
