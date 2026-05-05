import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type StockWithProveedor = Prisma.StockGetPayload<{
  include: { proveedor: true }
}>

export const StockRepository = {
  async findAll(): Promise<StockWithProveedor[]> {
    return prisma.stock.findMany({
      include: { proveedor: true },
      orderBy: { createdAt: 'desc' }
    })
  },

  async findById(id: string): Promise<StockWithProveedor | null> {
    return prisma.stock.findUnique({
      where: { id },
      include: { proveedor: true }
    })
  },

  async create(data: {
    proveedorId: string;
    codigo: string;
    codigoOriginal?: string;
    descripcion: string;
    cantidad: number;
    cantidadCritica: number;
    cantidadSugerida: number;
    fechaPedido?: Date;
    fechaRecibido?: Date;
    precioCosto: number;
    precioLista: number;
    precioVenta: number;
  }) {
    return prisma.stock.create({
      data: {
        ...data,
        precioCosto: new Prisma.Decimal(data.precioCosto),
        precioLista: new Prisma.Decimal(data.precioLista),
        precioVenta: new Prisma.Decimal(data.precioVenta),
      },
      include: { proveedor: true }
    })
  },

  async update(id: string, data: {
    proveedorId?: string;
    codigo?: string;
    codigoOriginal?: string;
    descripcion?: string;
    cantidad?: number;
    cantidadCritica?: number;
    cantidadSugerida?: number;
    fechaPedido?: Date;
    fechaRecibido?: Date;
    precioCosto?: number;
    precioLista?: number;
    precioVenta?: number;
  }) {
    const updateData: any = { ...data };
    
    if (data.precioCosto !== undefined) updateData.precioCosto = new Prisma.Decimal(data.precioCosto);
    if (data.precioLista !== undefined) updateData.precioLista = new Prisma.Decimal(data.precioLista);
    if (data.precioVenta !== undefined) updateData.precioVenta = new Prisma.Decimal(data.precioVenta);

    return prisma.stock.update({
      where: { id },
      data: updateData,
      include: { proveedor: true }
    })
  },

  async delete(id: string) {
    return prisma.stock.delete({
      where: { id }
    })
  }
}
