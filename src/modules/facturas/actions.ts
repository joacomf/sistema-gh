"use server"

import { FacturaRepository, FacturaWithItems } from "@/repositories/factura.repository"
import { revalidatePath } from "next/cache"

function serializeStock(stock: FacturaWithItems["items"][number]["stock"]) {
  return {
    ...stock,
    precioCosto: stock.precioCosto.toNumber(),
    precioLista: stock.precioLista.toNumber(),
    precioVenta: stock.precioVenta.toNumber(),
  }
}

function serializeFactura(factura: FacturaWithItems) {
  return {
    ...factura,
    importe: factura.importe.toNumber(),
    items: factura.items.map((item) => ({
      ...item,
      stock: serializeStock(item.stock),
    })),
  }
}

export async function getFacturasAction() {
  try {
    const data = await FacturaRepository.findAll()
    return data.map(serializeFactura)
  } catch (error) {
    console.error("Error al obtener facturas:", error)
    throw new Error("No se pudieron cargar las facturas")
  }
}

export async function createFacturaAction(data: {
  proveedorId: string
  numero: string
  importe: number
  items: { stockId: string; cantidad: number }[]
}) {
  try {
    const factura = await FacturaRepository.create(data)
    revalidatePath("/dashboard/facturas")
    revalidatePath("/dashboard/pedidos")
    revalidatePath("/dashboard/stock")
    return { success: true, data: serializeFactura(factura) }
  } catch (error) {
    console.error("Error al crear factura:", error)
    return { success: false, error: "No se pudo registrar la factura" }
  }
}
