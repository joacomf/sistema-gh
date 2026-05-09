"use server"

import { VentaRepository, VentaWithItems } from '@/repositories/venta.repository'
import { GastoRepository } from '@/repositories/gasto.repository'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

type CarritoItem = {
  stockId: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

type ReposicionItem = {
  stockId: string
  descripcion: string
  cantidadSugerida: number
}

function buildDescripcion(items: CarritoItem[]): string {
  const words = items.map(i => i.descripcion.split(' ')[0])
  const first3 = words.slice(0, 3).join(', ')
  const suffix = items.length > 3 ? '…' : ''
  return `${first3}${suffix} (${items.length} art.)`
}

function serializeVenta(venta: VentaWithItems) {
  return {
    ...venta,
    importe: venta.importe.toNumber(),
    items: venta.items.map(item => ({
      ...item,
      precioUnitario: item.precioUnitario.toNumber(),
      subtotal: item.subtotal.toNumber(),
      stock: {
        ...item.stock,
        precioCosto: item.stock.precioCosto.toNumber(),
        precioLista: item.stock.precioLista.toNumber(),
        precioVenta: item.stock.precioVenta.toNumber(),
      },
    })),
  }
}

export async function checkoutAction(data: {
  carrito: CarritoItem[]
  metodoPago: string
  facturada: boolean
  recargo: number
}): Promise<{ success: boolean; data?: { ventaId: string; reposicion: ReposicionItem[] }; error?: string }> {
  try {
    const total = data.carrito.reduce((acc, i) => acc + i.subtotal, 0)
    const importe = data.metodoPago === 'CREDITO'
      ? total * (1 + data.recargo / 100)
      : total

    const { venta } = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          descripcion: buildDescripcion(data.carrito),
          importe: new Prisma.Decimal(importe),
          metodoPago: data.metodoPago as 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'MERCADO_PAGO',
          facturada: data.facturada,
          items: {
            create: data.carrito.map(i => ({
              stockId: i.stockId,
              descripcion: i.descripcion,
              cantidad: i.cantidad,
              precioUnitario: new Prisma.Decimal(i.precioUnitario),
              subtotal: new Prisma.Decimal(i.subtotal),
            })),
          },
        },
        include: { items: { include: { stock: true } } },
      })
      for (const item of data.carrito) {
        await tx.stock.update({
          where: { id: item.stockId },
          data: { cantidad: { decrement: item.cantidad } },
        })
      }
      return { venta }
    })

    revalidatePath('/dashboard/ventas')
    revalidatePath('/dashboard/stock')

    const stockIds = data.carrito.map(i => i.stockId)
    const stocks = await prisma.stock.findMany({
      where: { id: { in: stockIds } },
      select: { id: true, cantidadSugerida: true },
    })
    const stockMap = new Map(stocks.map(s => [s.id, s]))
    const reposicion: ReposicionItem[] = data.carrito.map(item => ({
      stockId: item.stockId,
      descripcion: item.descripcion,
      cantidadSugerida: stockMap.get(item.stockId)?.cantidadSugerida ?? 10,
    }))

    return { success: true, data: { ventaId: venta.id, reposicion } }
  } catch (error) {
    console.error('Error en checkout:', error)
    return { success: false, error: 'No se pudo registrar la venta' }
  }
}

export async function crearPedidosAction(
  pedidos: { stockId: string; cantidad: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.repuestoPedido.createMany({
      data: pedidos.map(p => ({ stockId: p.stockId, cantidad: p.cantidad })),
    })
    revalidatePath('/dashboard/pedidos')
    return { success: true }
  } catch (error) {
    console.error('Error al crear pedidos:', error)
    return { success: false, error: 'No se pudieron crear los pedidos' }
  }
}

export async function eliminarVentaAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await VentaRepository.deleteById(id)
    revalidatePath('/dashboard/libro-diario')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar venta:', error)
    return { success: false, error: 'No se pudo eliminar la venta' }
  }
}

export async function agregarGastoAction(data: {
  descripcion: string
  importe: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    await GastoRepository.create(data)
    revalidatePath('/dashboard/libro-diario')
    return { success: true }
  } catch (error) {
    console.error('Error al agregar gasto:', error)
    return { success: false, error: 'No se pudo registrar el gasto' }
  }
}

export async function eliminarGastoAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await GastoRepository.deleteById(id)
    revalidatePath('/dashboard/libro-diario')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar gasto:', error)
    return { success: false, error: 'No se pudo eliminar el gasto' }
  }
}

export async function getVentaItemsAction(
  ventaId: string
): Promise<{ success: boolean; data?: ReturnType<typeof serializeVenta>; error?: string }> {
  try {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: { items: { include: { stock: true } } },
    })
    if (!venta) return { success: false, error: 'Venta no encontrada' }
    return { success: true, data: serializeVenta(venta) }
  } catch (error) {
    console.error('Error al obtener items:', error)
    return { success: false, error: 'No se pudieron cargar los detalles' }
  }
}
