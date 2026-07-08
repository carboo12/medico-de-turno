import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const unidades = [
    'PUERTO MORAZAN', 'EL VIEJO NORTE', 'EL VIEJO SUR', 'REALEJO', 
    'CORINTO', 'CHICHIGALPA', 'POSOLTEGA', 'SOMOTILLO', 
    'VILLANUEVA', 'SAN PEDRO', 'SAN FRANCISCO', 'CINCO PINOS', 
    'SANTO TOMAS', 'VILLA 15 JULIO', 'RCM', 'MCS', 'CMP'
  ]

  for (const nombre of unidades) {
    await prisma.unidad.upsert({
      where: { nombre },
      update: {},
      create: { nombre }
    })
  }
  console.log('17 unidades iniciales creadas.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
