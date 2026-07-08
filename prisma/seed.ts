import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  // Create Operador
  const admin = await prisma.operador.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      usuario: 'admin',
      password: hashedPassword,
      nombre_completo: 'Administrador del Sistema',
    },
  })

  // Create Unidades
  const unidadesNames = [
    'PUERTO MORAZAN', 'EL VIEJO NORTE', 'EL VIEJO SUR', 'REALEJO', 
    'CORINTO', 'CHICHIGALPA', 'POSOLTEGA', 'SOMOTILLO', 
    'VILLANUEVA', 'SAN PEDRO DEL NORTE', 'SAN FRANCISCO DEL NORTE', 'CINCO PINOS', 
    'SANTO TOMAS DEL NORTE', 'VILLA 15 DE JULIO', 'RCM', 'MCS', 'CMP',
    'SAN VICENTE DE PAUL'
  ]

  const unidadRecords: Record<string, number> = {}
  
  for (const nombre of unidadesNames) {
    const u = await prisma.unidad.upsert({
      where: { nombre },
      update: {},
      create: { nombre }
    })
    unidadRecords[nombre] = u.id
  }

  // Create Sample Doctors
  const medicos = [
    { nombre: 'Dr. Juan Pérez', telefono: '555-0101', unidad_id: unidadRecords['CHICHIGALPA'], tipo: 'GENERAL' },
    { nombre: 'Dra. María García', telefono: '555-0102', unidad_id: unidadRecords['CORINTO'], tipo: 'SOCIAL' },
    { nombre: 'Dr. Carlos Ruiz', telefono: '555-0103', unidad_id: unidadRecords['SOMOTILLO'], tipo: 'GENERAL' },
  ]

  for (const medico of medicos) {
    await prisma.catalogoMedico.create({
      data: medico,
    })
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
