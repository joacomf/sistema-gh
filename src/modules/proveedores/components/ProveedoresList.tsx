"use client"

import { useState } from "react"
import { deleteProveedorAction } from "../actions"
import { Pencil, Trash2 } from "lucide-react"

export default function ProveedoresList({ proveedores, onEdit }: {
  proveedores: any[],
  onEdit: (p: any) => void
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este proveedor?")) return
    setIsDeleting(id)
    try {
      await deleteProveedorAction(id)
    } catch {
      alert("Error al eliminar el proveedor")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-slate-700">
              Nombre
            </th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
              Descuentos
            </th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
              Notas
            </th>
            <th className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-slate-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {proveedores.map((proveedor) => (
            <tr key={proveedor.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-4 pl-6 pr-3 text-base font-semibold text-slate-900">
                {proveedor.nombre}
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                <div className="flex flex-wrap gap-1.5">
                  {proveedor.descuentos?.map((d: any) => (
                    <span
                      key={d.id}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200"
                    >
                      {d.descripcion}: {d.porcentaje}%
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">
                {proveedor.notas}
              </td>
              <td className="py-4 pl-3 pr-6">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(proveedor)}
                    className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(proveedor.id)}
                    disabled={isDeleting === proveedor.id}
                    className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {isDeleting === proveedor.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {proveedores.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-slate-400">
                No hay proveedores registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
