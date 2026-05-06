"use server"

import { StockRepository, StockWithProveedor } from "@/repositories/stock.repository"
import { revalidatePath } from "next/cache"

function serializeStock(stock: StockWithProveedor) {
  return {
    ...stock,
    precioCosto: stock.precioCosto.toNumber(),
    precioLista: stock.precioLista.toNumber(),
    precioVenta: stock.precioVenta.toNumber(),
  }
}

export async function getStockAction() {
  try {
    const data = await StockRepository.findAll()
    return data.map(serializeStock)
  } catch (error) {
    console.error("Error al obtener stock:", error)
    throw new Error("No se pudo cargar el stock")
  }
}

export async function createStockAction(data: {
  proveedorId: string;
  codigo: string;
  codigoOriginal?: string;
  descripcion: string;
  cantidad: number;
  cantidadCritica: number;
  cantidadSugerida: number;
  fechaPedido?: Date;
  fechaRecibido?: Date;
  precioCosto: number;
  precioLista: number;
  precioVenta: number;
}) {
  try {
    const stock = await StockRepository.create(data)
    revalidatePath("/dashboard/stock")
    return { success: true, data: serializeStock(stock) }
  } catch (error) {
    console.error("Error al crear stock:", error)
    return { success: false, error: "No se pudo crear el registro de stock" }
  }
}

export async function updateStockAction(
  id: string,
  data: {
    proveedorId?: string;
    codigo?: string;
    codigoOriginal?: string;
    descripcion?: string;
    cantidad?: number;
    cantidadCritica?: number;
    cantidadSugerida?: number;
    fechaPedido?: Date;
    fechaRecibido?: Date;
    precioCosto?: number;
    precioLista?: number;
    precioVenta?: number;
  }
) {
  try {
    const stock = await StockRepository.update(id, data)
    revalidatePath("/dashboard/stock")
    return { success: true, data: serializeStock(stock) }
  } catch (error) {
    console.error("Error al actualizar stock:", error)
    return { success: false, error: "No se pudo actualizar el registro de stock" }
  }
}

export async function deleteStockAction(id: string) {
  try {
    await StockRepository.delete(id)
    revalidatePath("/dashboard/stock")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar stock:", error)
    return { success: false, error: "No se pudo eliminar el registro de stock" }
  }
}
