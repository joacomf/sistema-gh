"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import React from "react"

export default function FacturasList({ facturas }: { facturas: any[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        return next
    })
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3.5 pl-4 pr-2 w-8" />
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Número</th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Proveedor</th>
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700">Importe</th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Fecha</th>
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700 pr-6">Ítems</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {facturas.map(factura => {
            const isOpen = expanded.has(factura.id)
            return (
              <React.Fragment key={factura.id}>
                <tr
                  onClick={() => toggle(factura.id)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 pl-4 pr-2 text-slate-400">
                    {isOpen
                      ? <ChevronDown size={16} />
                      : <ChevronRight size={16} />}
                  </td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-900">
                    {factura.numero}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {factura.proveedor?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900 text-right">
                    ${Number(factura.importe).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {new Date(factura.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-4 pr-6 text-right">
                    <span className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                      {factura.items.length}
                    </span>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="bg-slate-50/60">
                    <td colSpan={6} className="px-10 py-4">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="pb-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Código</th>
                            <th className="pb-2 pl-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Descripción</th>
                            <th className="pb-2 pl-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Proveedor</th>
                            <th className="pb-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {factura.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="py-2 text-sm font-semibold text-slate-900">{item.stock.codigo}</td>
                              <td className="py-2 pl-4 text-sm text-slate-600">{item.stock.descripcion}</td>
                              <td className="py-2 pl-4 text-sm text-slate-400">{item.stock.proveedor?.nombre}</td>
                              <td className="py-2 text-right text-sm font-semibold text-slate-900">{item.cantidad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
          {facturas.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                No hay facturas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
