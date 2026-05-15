"use server"

import { StockRepository } from "@/repositories/stock.repository"

function serializeStockWithCajas(stock: any) {
  return {
    ...stock,
    precioCosto: Number(stock.precioCosto),
    precioLista: Number(stock.precioLista),
    precioVenta: Number(stock.precioVenta),
    fechaPedido: stock.fechaPedido ? stock.fechaPedido.toISOString() : null,
    fechaRecibido: stock.fechaRecibido ? stock.fechaRecibido.toISOString() : null,
    createdAt: stock.createdAt.toISOString(),
    updatedAt: stock.updatedAt.toISOString(),
  }
}

export async function searchStockConCajasAction(q: string) {
  if (!q.trim()) return { success: true as const, data: [] }
  try {
    const results = await StockRepository.searchWithCajas(q)
    return { success: true as const, data: results.map(serializeStockWithCajas) }
  } catch (error) {
    console.error("Error al buscar stock:", error)
    return { success: false as const, error: "No se pudo buscar el artículo" }
  }
}

export async function getStockConCajasAction(id: string) {
  try {
    const stock = await StockRepository.findByIdWithCajas(id)
    if (!stock) return { success: false as const, error: "Artículo no encontrado" }
    return { success: true as const, data: serializeStockWithCajas(stock) }
  } catch (error) {
    console.error("Error al obtener stock:", error)
    return { success: false as const, error: "No se pudo cargar el artículo" }
  }
}
