// src/repositories/venta.repository.ts
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type VentaWithItems = Prisma.VentaGetPayload<{
  include: { items: { include: { stock: true } } }
}>

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export const VentaRepository = {
  async findByFecha(fecha: Date): Promise<VentaWithItems[]> {
    return prisma.venta.findMany({
      where: {
        fecha: {
          gte: startOfDay(fecha),
          lte: endOfDay(fecha),
        },
      },
      include: { items: { include: { stock: true } } },
      orderBy: { fecha: 'asc' },
    })
  },

  async create(data: {
    descripcion: string
    importe: number
    metodoPago: string
    facturada: boolean
    items: { stockId: string; descripcion: string; cantidad: number; precioUnitario: number; subtotal: number }[]
  }): Promise<VentaWithItems> {
    return prisma.venta.create({
      data: {
        descripcion: data.descripcion,
        importe: new Prisma.Decimal(data.importe),
        metodoPago: data.metodoPago as 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'MERCADO_PAGO',
        facturada: data.facturada,
        items: {
          create: data.items.map(i => ({
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
  },

  async deleteById(id: string): Promise<void> {
    await prisma.venta.delete({ where: { id } })
  },
}
