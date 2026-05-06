"use server"

import { FacturaRepository } from "@/repositories/factura.repository"
import { revalidatePath } from "next/cache"

export async function getFacturasAction() {
  try {
    return await FacturaRepository.findAll()
  } catch (error) {
    console.error("Error al obtener facturas:", error)
    throw new Error("No se pudieron cargar las facturas")
  }
}

export async function createFacturaAction(data: {
  numero: string
  importe: number
  items: { stockId: string; cantidad: number }[]
}) {
  try {
    const factura = await FacturaRepository.create(data)
    revalidatePath("/dashboard/facturas")
    revalidatePath("/dashboard/pedidos")
    revalidatePath("/dashboard/stock")
    return { success: true, data: factura }
  } catch (error) {
    console.error("Error al crear factura:", error)
    return { success: false, error: "No se pudo registrar la factura" }
  }
}
