import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type StockWithProveedor = Prisma.StockGetPayload<{
  include: { proveedor: true }
}>

export type StockWithCajas = Prisma.StockGetPayload<{
  include: {
    proveedor: true
    cajas: { include: { caja: true } }
  }
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
    imagen?: string | null;
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
    imagen?: string | null;
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
  },

  async findByIdWithCajas(id: string): Promise<StockWithCajas | null> {
    return prisma.stock.findUnique({
      where: { id },
      include: {
        proveedor: true,
        cajas: { include: { caja: true } }
      }
    })
  },

  async searchWithCajas(q: string): Promise<StockWithCajas[]> {
    return prisma.stock.findMany({
      where: {
        OR: [
          { codigo: { contains: q } },
          { codigoOriginal: { contains: q } },
          { descripcion: { contains: q } },
        ]
      },
      include: {
        proveedor: true,
        cajas: { include: { caja: true } }
      },
      orderBy: { descripcion: 'asc' },
      take: 20,
    })
  },

  async search(params: {
    proveedorId?: string
    codigo?: string
    page?: number
    pageSize?: number
  }): Promise<{ data: StockWithProveedor[]; total: number }> {
    const pageSize = params.pageSize ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * pageSize

    const conditions: Prisma.StockWhereInput[] = []
    if (params.proveedorId) {
      conditions.push({ proveedorId: params.proveedorId })
    }
    if (params.codigo) {
      conditions.push({
        OR: [
          { codigo: { contains: params.codigo } },
          { codigoOriginal: { contains: params.codigo } },
          { descripcion: { contains: params.codigo } },
        ],
      })
    }

    const where: Prisma.StockWhereInput =
      conditions.length > 0 ? { AND: conditions } : {}

    const [data, total] = await Promise.all([
      prisma.stock.findMany({
        where,
        include: { proveedor: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.stock.count({ where }),
    ])

    return { data, total }
  }
}
