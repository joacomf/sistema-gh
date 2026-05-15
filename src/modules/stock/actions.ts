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

export async function getStockAction(params: {
  page?: number
  proveedorId?: string
  codigo?: string
} = {}) {
  try {
    const { data, total } = await StockRepository.search({
      page: params.page ?? 1,
      proveedorId: params.proveedorId || undefined,
      codigo: params.codigo || undefined,
    })
    const pageSize = 20
    return {
      data: data.map(serializeStock),
      total,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    }
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
  imagen?: string | null;
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
    imagen?: string | null;
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
