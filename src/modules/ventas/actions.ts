"use server"

import { VentaRepository } from '@/repositories/venta.repository'
import { GastoRepository } from '@/repositories/gasto.repository'
import { RepuestoPedidoRepository } from '@/repositories/repuestoPedido.repository'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

type CarritoItem = {
  stockId: string
  descripcion: string
  cantidad: number
  precioCosto: number
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
              precioCosto: new Prisma.Decimal(i.precioCosto),
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

    const reposicion: ReposicionItem[] = data.carrito.map(item => ({
      stockId: item.stockId,
      descripcion: item.descripcion,
      cantidadSugerida: item.cantidad,
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
    for (const p of pedidos) {
      await RepuestoPedidoRepository.upsertPendiente(p)
    }
    revalidatePath('/dashboard/pedidos')
    return { success: true }
  } catch (error) {
    console.error('Error al crear pedidos:', error)
    return { success: false, error: 'No se pudieron crear los pedidos' }
  }
}

export async function editarVentaAction(data: {
  id: string
  metodoPago: string
  facturada: boolean
  items: { id: string; precioUnitario: number; cantidad: number }[]
}): Promise<{ success: boolean; error?: string }> {
  try {
    const baseTotal = data.items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)

    let importe = baseTotal
    if (data.metodoPago === 'CREDITO') {
      const row = await prisma.configuracion.findUnique({ where: { clave: 'recargo_tarjeta' } })
      const recargo = parseFloat(row?.valor ?? '0') || 0
      importe = baseTotal * (1 + recargo / 100)
    }

    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        await tx.ventaItem.update({
          where: { id: item.id },
          data: {
            precioUnitario: new Prisma.Decimal(item.precioUnitario),
            subtotal: new Prisma.Decimal(item.precioUnitario * item.cantidad),
          },
        })
      }
      await tx.venta.update({
        where: { id: data.id },
        data: {
          metodoPago: data.metodoPago as 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'MERCADO_PAGO',
          facturada: data.facturada,
          importe: new Prisma.Decimal(importe),
        },
      })
    })

    revalidatePath('/dashboard/libro-diario')
    return { success: true }
  } catch (error) {
    console.error('Error al editar venta:', error)
    return { success: false, error: 'No se pudo actualizar la venta' }
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

export async function editarGastoAction(data: {
  id: string
  descripcion: string
  importe: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    await GastoRepository.update(data.id, { descripcion: data.descripcion, importe: data.importe })
    revalidatePath('/dashboard/libro-diario')
    return { success: true }
  } catch (error) {
    console.error('Error al editar gasto:', error)
    return { success: false, error: 'No se pudo actualizar el gasto' }
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

