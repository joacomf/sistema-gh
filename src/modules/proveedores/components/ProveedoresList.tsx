"use client"

import { useState } from "react"
import { deleteProveedorAction } from "../actions"

export default function ProveedoresList({ proveedores, onEdit }: { 
  proveedores: any[], 
  onEdit: (p: any) => void 
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este proveedor?")) return
    
    setIsDeleting(id)
    try {
      await deleteProveedorAction(id)
    } catch (e) {
      alert("Error al eliminar")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descuentos</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notas</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {proveedores.map((proveedor) => (
            <tr key={proveedor.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{proveedor.nombre}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {proveedor.descuentos?.map((d: any) => (
                  <span key={d.id} className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 mr-1">
                    {d.descripcion}: {d.porcentaje}%
                  </span>
                ))}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 truncate max-w-xs">{proveedor.notas}</td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button 
                  onClick={() => onEdit(proveedor)} 
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(proveedor.id)} 
                  disabled={isDeleting === proveedor.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {isDeleting === proveedor.id ? "Eliminando..." : "Eliminar"}
                </button>
              </td>
            </tr>
          ))}
          {proveedores.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-8 text-gray-500">No hay proveedores registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
