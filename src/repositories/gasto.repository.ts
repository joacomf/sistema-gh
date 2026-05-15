// src/repositories/gasto.repository.ts
import { prisma } from '@/lib/prisma'
import { Prisma, Gasto } from '@prisma/client'

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export const GastoRepository = {
  async findByFecha(fecha: Date): Promise<Gasto[]> {
    return prisma.gasto.findMany({
      where: {
        fecha: {
          gte: startOfDay(fecha),
          lte: endOfDay(fecha),
        },
      },
      orderBy: { fecha: 'asc' },
    })
  },

  async create(data: { descripcion: string; importe: number }): Promise<Gasto> {
    return prisma.gasto.create({
      data: {
        descripcion: data.descripcion,
        importe: new Prisma.Decimal(data.importe),
      },
    })
  },

  async update(id: string, data: { descripcion: string; importe: number }): Promise<Gasto> {
    return prisma.gasto.update({
      where: { id },
      data: {
        descripcion: data.descripcion,
        importe: new Prisma.Decimal(data.importe),
      },
    })
  },

  async deleteById(id: string): Promise<void> {
    await prisma.gasto.delete({ where: { id } })
  },
}
