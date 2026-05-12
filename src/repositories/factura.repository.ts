import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type FacturaWithItems = Prisma.FacturaGetPayload<{
  include: {
    proveedor: true
    items: { include: { stock: { include: { proveedor: true } } } }
  }
}>

export const FacturaRepository = {
  async findAll(): Promise<FacturaWithItems[]> {
    return prisma.factura.findMany({
      include: {
        proveedor: true,
        items: {
          include: { stock: { include: { proveedor: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async findPaginated(params: {
    proveedorId?: string
    numero?: string
    page: number
    pageSize?: number
  }): Promise<{ data: FacturaWithItems[]; total: number }> {
    const pageSize = params.pageSize ?? 20
    const skip = (params.page - 1) * pageSize

    const where: Prisma.FacturaWhereInput = {}
    if (params.proveedorId) where.proveedorId = params.proveedorId
    if (params.numero) where.numero = { contains: params.numero }

    const [data, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: {
          proveedor: true,
          items: {
            include: { stock: { include: { proveedor: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.factura.count({ where }),
    ])

    return { data, total }
  },

  async create(data: {
    proveedorId: string
    numero: string
    importe: number
    items: { stockId: string; cantidad: number }[]
  }): Promise<FacturaWithItems> {
    return prisma.$transaction(async (tx) => {
      const factura = await tx.factura.create({
        data: {
          proveedorId: data.proveedorId,
          numero: data.numero,
          importe: new Prisma.Decimal(data.importe),
        },
      })

      await tx.facturaItem.createMany({
        data: data.items.map((item) => ({
          facturaId: factura.id,
          stockId: item.stockId,
          cantidad: item.cantidad,
        })),
      })

      for (const item of data.items) {
        await tx.stock.update({
          where: { id: item.stockId },
          data: { cantidad: { increment: item.cantidad } },
        })

        const pedidos = await tx.repuestoPedido.findMany({
          where: {
            stockId: item.stockId,
            fechaPedido: { not: null },
            fechaRecibido: null,
          },
          orderBy: { fechaPedido: "asc" },
        })

        let remaining = item.cantidad

        for (const pedido of pedidos) {
          if (remaining <= 0) break

          if (remaining >= pedido.cantidad) {
            await tx.repuestoPedido.update({
              where: { id: pedido.id },
              data: { fechaRecibido: new Date() },
            })
            remaining -= pedido.cantidad
          } else {
            await tx.repuestoPedido.update({
              where: { id: pedido.id },
              data: {
                cantidad: pedido.cantidad - remaining,
                fechaPedido: null,
                fechaRecibido: null,
              },
            })
            remaining = 0
          }
        }
      }

      return tx.factura.findUniqueOrThrow({
        where: { id: factura.id },
        include: {
          proveedor: true,
          items: {
            include: { stock: { include: { proveedor: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    })
  },
}
