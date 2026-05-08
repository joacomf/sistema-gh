// src/repositories/configuracion.repository.ts
import { prisma } from '@/lib/prisma'

export const ConfiguracionRepository = {
  async findByKey(clave: string): Promise<string | null> {
    const row = await prisma.configuracion.findUnique({ where: { clave } })
    return row?.valor ?? null
  },
}
