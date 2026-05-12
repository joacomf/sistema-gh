"use server"

import { RepuestoPedidoRepository, RepuestoPedidoWithStock } from "@/repositories/repuestoPedido.repository"
import { revalidatePath } from "next/cache"

function serializeRepuestoPedido(r: RepuestoPedidoWithStock) {
  return {
    ...r,
    stock: {
      ...r.stock,
      precioCosto: r.stock.precioCosto.toNumber(),
      precioLista: r.stock.precioLista.toNumber(),
      precioVenta: r.stock.precioVenta.toNumber(),
    },
  }
}

export async function getRepuestosAPedirAction() {
  try {
    const data = await RepuestoPedidoRepository.findAPedir()
    return data.map(serializeRepuestoPedido)
  } catch (error) {
    console.error("Error al obtener repuestos a pedir:", error)
    throw new Error("No se pudieron cargar los repuestos a pedir")
  }
}

export async function getRepuestosPedidosAction() {
  try {
    const data = await RepuestoPedidoRepository.findPedidos()
    return data.map(serializeRepuestoPedido)
  } catch (error) {
    console.error("Error al obtener repuestos pedidos:", error)
    throw new Error("No se pudieron cargar los repuestos pedidos")
  }
}

export async function createRepuestoPedidoAction(data: {
  stockId: string
  cantidad: number
}) {
  try {
    const record = await RepuestoPedidoRepository.upsertPendiente(data)
    revalidatePath("/dashboard/pedidos")
    return { success: true, data: record }
  } catch (error) {
    console.error("Error al crear repuesto pedido:", error)
    return { success: false, error: "No se pudo agregar el repuesto" }
  }
}

export async function marcarComoPedidoAction(id: string) {
  try {
    await RepuestoPedidoRepository.marcarComoPedido(id)
    revalidatePath("/dashboard/pedidos")
    return { success: true }
  } catch (error) {
    console.error("Error al marcar como pedido:", error)
    return { success: false, error: "No se pudo marcar como pedido" }
  }
}

export async function cancelarPedidoAction(id: string) {
  try {
    await RepuestoPedidoRepository.cancelarPedido(id)
    revalidatePath("/dashboard/pedidos")
    return { success: true }
  } catch (error) {
    console.error("Error al cancelar pedido:", error)
    return { success: false, error: "No se pudo cancelar el pedido" }
  }
}

export async function deleteRepuestoPedidoAction(id: string) {
  try {
    await RepuestoPedidoRepository.delete(id)
    revalidatePath("/dashboard/pedidos")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar repuesto:", error)
    return { success: false, error: "No se pudo eliminar el repuesto" }
  }
}
