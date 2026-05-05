import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type ProveedorWithDescuentos = Prisma.ProveedorGetPayload<{
  include: { descuentos: true }
}>

export const ProveedorRepository = {
  async findAll(): Promise<ProveedorWithDescuentos[]> {
    return prisma.proveedor.findMany({
      include: { descuentos: true },
      orderBy: { nombre: 'asc' }
    })
  },

  async findById(id: string): Promise<ProveedorWithDescuentos | null> {
    return prisma.proveedor.findUnique({
      where: { id },
      include: { descuentos: true }
    })
  },

  async create(data: { nombre: string; notas?: string; descuentos?: { descripcion: string; porcentaje: number }[] }) {
    return prisma.proveedor.create({
      data: {
        nombre: data.nombre,
        notas: data.notas,
        descuentos: {
          create: data.descuentos?.map(d => ({
            descripcion: d.descripcion,
            porcentaje: new Prisma.Decimal(d.porcentaje)
          })) || []
        }
      },
      include: { descuentos: true }
    })
  },

  async update(id: string, data: { nombre: string; notas?: string; descuentos?: { id?: string; descripcion: string; porcentaje: number }[] }) {
    // Para simplificar: borramos los descuentos viejos que no estén en la nueva lista, 
    // actualizamos los existentes y creamos los nuevos.
    const incomingIds = data.descuentos?.map(d => d.id).filter(Boolean) as string[] || [];

    return prisma.$transaction(async (tx) => {
      // Borrar los que ya no están
      await tx.descuentoProveedor.deleteMany({
        where: {
          proveedorId: id,
          id: { notIn: incomingIds }
        }
      });

      // Actualizar el proveedor
      const updatedProveedor = await tx.proveedor.update({
        where: { id },
        data: {
          nombre: data.nombre,
          notas: data.notas,
        }
      });

      // Upsert de los descuentos
      if (data.descuentos && data.descuentos.length > 0) {
        for (const desc of data.descuentos) {
          if (desc.id) {
            await tx.descuentoProveedor.update({
              where: { id: desc.id },
              data: {
                descripcion: desc.descripcion,
                porcentaje: new Prisma.Decimal(desc.porcentaje)
              }
            })
          } else {
            await tx.descuentoProveedor.create({
              data: {
                proveedorId: id,
                descripcion: desc.descripcion,
                porcentaje: new Prisma.Decimal(desc.porcentaje)
              }
            })
          }
        }
      }

      return tx.proveedor.findUnique({
        where: { id },
        include: { descuentos: true }
      });
    });
  },

  async delete(id: string) {
    return prisma.proveedor.delete({
      where: { id }
    })
  }
}
