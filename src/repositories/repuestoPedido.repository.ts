import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type RepuestoPedidoWithStock = Prisma.RepuestoPedidoGetPayload<{
  include: { stock: { include: { proveedor: true } } }
}>

export const RepuestoPedidoRepository = {
  async findAPedir(): Promise<RepuestoPedidoWithStock[]> {
    return prisma.repuestoPedido.findMany({
      where: { fechaPedido: null },
      include: { stock: { include: { proveedor: true } } },
      orderBy: { createdAt: "asc" },
    })
  },

  async findPedidos(): Promise<RepuestoPedidoWithStock[]> {
    return prisma.repuestoPedido.findMany({
      where: {
        fechaPedido: { not: null },
        fechaRecibido: null,
      },
      include: { stock: { include: { proveedor: true } } },
      orderBy: { fechaPedido: "asc" },
    })
  },

  async create(data: { stockId: string; cantidad: number }) {
    return prisma.repuestoPedido.create({
      data,
      include: { stock: { include: { proveedor: true } } },
    })
  },

  async marcarComoPedido(id: string) {
    return prisma.repuestoPedido.update({
      where: { id },
      data: { fechaPedido: new Date() },
    })
  },

  async cancelarPedido(id: string) {
    return prisma.repuestoPedido.update({
      where: { id },
      data: { fechaPedido: null },
    })
  },

  async delete(id: string) {
    return prisma.repuestoPedido.delete({ where: { id } })
  },
}
