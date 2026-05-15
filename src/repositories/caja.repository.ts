import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type CajaWithCount = Prisma.CajaGetPayload<{
  include: { _count: { select: { stocks: true } } }
}>

export type CajaWithStocks = Prisma.CajaGetPayload<{
  include: {
    stocks: {
      include: {
        stock: { include: { proveedor: true } }
      }
    }
  }
}>

export const CajaRepository = {
  async findAll(): Promise<CajaWithCount[]> {
    return prisma.caja.findMany({
      include: { _count: { select: { stocks: true } } },
      orderBy: { nombre: 'asc' },
    })
  },

  async findById(id: string): Promise<CajaWithStocks | null> {
    return prisma.caja.findUnique({
      where: { id },
      include: {
        stocks: {
          include: {
            stock: { include: { proveedor: true } }
          }
        },
      },
    })
  },

  async search(q: string): Promise<CajaWithCount[]> {
    return prisma.caja.findMany({
      where: q ? {
        OR: [
          { nombre: { contains: q } },
          { ubicacion: { contains: q } },
          {
            stocks: {
              some: {
                stock: {
                  OR: [
                    { descripcion: { contains: q } },
                    { codigo: { contains: q } },
                  ],
                },
              },
            },
          },
        ],
      } : {},
      include: { _count: { select: { stocks: true } } },
      orderBy: { nombre: 'asc' },
    })
  },

  async create(data: { nombre: string; ubicacion: string }): Promise<CajaWithCount> {
    return prisma.caja.create({
      data,
      include: { _count: { select: { stocks: true } } },
    })
  },

  async update(id: string, data: { nombre: string; ubicacion: string }): Promise<CajaWithCount> {
    return prisma.caja.update({
      where: { id },
      data,
      include: { _count: { select: { stocks: true } } },
    })
  },

  async delete(id: string) {
    return prisma.caja.delete({ where: { id } })
  },

  async addStock(cajaId: string, stockId: string) {
    return prisma.stockCaja.create({ data: { cajaId, stockId } })
  },

  async removeStock(cajaId: string, stockId: string) {
    return prisma.stockCaja.delete({
      where: { stockId_cajaId: { stockId, cajaId } },
    })
  },
}
