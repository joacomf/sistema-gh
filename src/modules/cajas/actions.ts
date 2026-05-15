"use server"

import { CajaRepository } from "@/repositories/caja.repository"
import { StockRepository } from "@/repositories/stock.repository"
import { revalidatePath } from "next/cache"

function serializeCaja(caja: any) {
  return {
    ...caja,
    createdAt: caja.createdAt.toISOString(),
    updatedAt: caja.updatedAt.toISOString(),
  }
}

function serializeCajaWithStocks(caja: any) {
  return {
    ...serializeCaja(caja),
    stocks: caja.stocks.map((sc: any) => ({
      ...sc,
      stock: {
        ...sc.stock,
        precioCosto: sc.stock.precioCosto.toNumber(),
        precioLista: sc.stock.precioLista.toNumber(),
        precioVenta: sc.stock.precioVenta.toNumber(),
        fechaPedido: sc.stock.fechaPedido?.toISOString() ?? null,
        fechaRecibido: sc.stock.fechaRecibido?.toISOString() ?? null,
        createdAt: sc.stock.createdAt.toISOString(),
        updatedAt: sc.stock.updatedAt.toISOString(),
      },
    })),
  }
}

export async function getCajasAction(q?: string) {
  try {
    const cajas = await CajaRepository.search(q ?? "")
    return { success: true as const, data: cajas.map(serializeCaja) }
  } catch (error) {
    console.error("Error al obtener cajas:", error)
    return { success: false as const, error: "No se pudieron cargar las cajas" }
  }
}

export async function getCajaByIdAction(id: string) {
  try {
    const caja = await CajaRepository.findById(id)
    if (!caja) return { success: true as const, data: null }
    return { success: true as const, data: serializeCajaWithStocks(caja) }
  } catch (error) {
    console.error("Error al obtener caja:", error)
    return { success: false as const, error: "No se pudo cargar la caja" }
  }
}

export async function createCajaAction(data: { nombre: string; ubicacion: string }) {
  try {
    const caja = await CajaRepository.create(data)
    revalidatePath("/dashboard/cajas")
    return { success: true as const, data: serializeCaja(caja) }
  } catch (error) {
    console.error("Error al crear caja:", error)
    return { success: false as const, error: "No se pudo crear la caja" }
  }
}

export async function updateCajaAction(id: string, data: { nombre: string; ubicacion: string }) {
  try {
    const caja = await CajaRepository.update(id, data)
    revalidatePath("/dashboard/cajas")
    return { success: true as const, data: serializeCaja(caja) }
  } catch (error) {
    console.error("Error al actualizar caja:", error)
    return { success: false as const, error: "No se pudo actualizar la caja" }
  }
}

export async function deleteCajaAction(id: string) {
  try {
    await CajaRepository.delete(id)
    revalidatePath("/dashboard/cajas")
    return { success: true as const }
  } catch (error) {
    console.error("Error al eliminar caja:", error)
    return { success: false as const, error: "No se pudo eliminar la caja" }
  }
}

export async function addStockACajaAction(cajaId: string, stockId: string) {
  try {
    await CajaRepository.addStock(cajaId, stockId)
    revalidatePath("/dashboard/cajas")
    return { success: true as const }
  } catch (error) {
    console.error("Error al asignar artículo:", error)
    return { success: false as const, error: "No se pudo asignar el artículo a la caja" }
  }
}

export async function removeStockDeCajaAction(cajaId: string, stockId: string) {
  try {
    await CajaRepository.removeStock(cajaId, stockId)
    revalidatePath("/dashboard/cajas")
    return { success: true as const }
  } catch (error) {
    console.error("Error al quitar artículo:", error)
    return { success: false as const, error: "No se pudo quitar el artículo de la caja" }
  }
}

export async function buscarStockParaCajaAction(q: string, cajaId: string) {
  try {
    if (!q.trim()) return { success: true as const, data: [] }
    const { data: allResults } = await StockRepository.search({ codigo: q, pageSize: 15 })
    const caja = await CajaRepository.findById(cajaId)
    const assignedIds = new Set(caja?.stocks.map(s => s.stockId) ?? [])
    const filtered = allResults
      .filter(s => !assignedIds.has(s.id))
      .map(s => ({
        id: s.id,
        codigo: s.codigo,
        descripcion: s.descripcion,
        cantidad: s.cantidad,
        proveedor: s.proveedor.nombre,
      }))
    return { success: true as const, data: filtered }
  } catch (error) {
    console.error("Error al buscar stock para caja:", error)
    return { success: false as const, error: "No se pudo buscar el stock" }
  }
}
