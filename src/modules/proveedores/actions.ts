"use server"

import { ProveedorRepository, ProveedorWithDescuentos } from "@/repositories/proveedor.repository"
import { revalidatePath } from "next/cache"

function serializeProveedor(proveedor: ProveedorWithDescuentos) {
  return {
    ...proveedor,
    descuentos: proveedor.descuentos.map((d) => ({
      ...d,
      porcentaje: d.porcentaje.toNumber(),
    })),
  }
}

export async function getProveedoresAction() {
  try {
    const data = await ProveedorRepository.findAll()
    return data.map(serializeProveedor)
  } catch (error) {
    console.error("Error al obtener proveedores:", error)
    throw new Error("No se pudieron cargar los proveedores")
  }
}

export async function createProveedorAction(data: {
  nombre: string
  notas?: string
  descuentos?: { descripcion: string; porcentaje: number }[]
}) {
  try {
    const proveedor = await ProveedorRepository.create(data)
    revalidatePath("/dashboard/proveedores")
    revalidatePath("/dashboard/stock")
    return { success: true, data: serializeProveedor(proveedor) }
  } catch (error) {
    console.error("Error al crear proveedor:", error)
    return { success: false, error: "No se pudo crear el proveedor" }
  }
}

export async function updateProveedorAction(
  id: string,
  data: {
    nombre: string
    notas?: string
    descuentos?: { id?: string; descripcion: string; porcentaje: number }[]
  }
) {
  try {
    const proveedor = await ProveedorRepository.update(id, data)
    revalidatePath("/dashboard/proveedores")
    revalidatePath("/dashboard/stock")
    return { success: true, data: proveedor ? serializeProveedor(proveedor) : null }
  } catch (error) {
    console.error("Error al actualizar proveedor:", error)
    return { success: false, error: "No se pudo actualizar el proveedor" }
  }
}

export async function deleteProveedorAction(id: string) {
  try {
    await ProveedorRepository.delete(id)
    revalidatePath("/dashboard/proveedores")
    revalidatePath("/dashboard/stock")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar proveedor:", error)
    return { success: false, error: "No se pudo eliminar el proveedor" }
  }
}
