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

  async findById(id: string): Promise<VentaWithItems | null> {
    return prisma.venta.findUnique({
      where: { id },
      include: { items: { include: { stock: true } } },
    })
  },

  async deleteById(id: string): Promise<void> {
    await prisma.venta.delete({ where: { id } })
  },
}
