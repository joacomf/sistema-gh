import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.configuracion.upsert({
    where: { clave: 'recargo_tarjeta' },
    update: {},
    create: { clave: 'recargo_tarjeta', valor: '10' },
  })
  console.log('Seed OK: recargo_tarjeta = 10')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
