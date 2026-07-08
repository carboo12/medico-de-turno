// @ts-nocheck
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/logger'

// --- REPORTES ---

export async function createReport(data: { fecha: string; medicos: number[] }): Promise<{ success: boolean; id?: number; error?: string }> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    // Verificar que el operador existe en la BD actual
    const operador = await prisma.operador.findUnique({
      where: { id: session.user.id }
    })

    if (!operador) {
      return { success: false, error: 'Su sesión ha expirado o la base de datos ha sido reiniciada. Por favor, cierre sesión y vuelva a entrar.' }
    }

    const result = await prisma.$transaction(async (tx) => {
      const padre = await tx.reportePadre.create({
        data: {
          fecha: new Date(data.fecha),
          operador_id: session.user.id,
        },
      })

      const detalles = data.medicos.map((medicoId) => ({
        reporte_id: padre.id,
        medico_id: medicoId,
      }))

      await tx.reporteDetalle.createMany({
        data: detalles,
      })

      return padre
    })

    await logAction('CREAR_REPORTE', `Creó reporte ID: ${result.id} con ${data.medicos.length} personas`)
    revalidatePath('/dashboard')
    return { success: true, id: result.id }
  } catch (error) {
    console.error('Error creating report:', error)
    return { success: false, error: 'Failed to create report' }
  }
}

export async function updateReport(id: number, data: { fecha: string; medicos: number[] }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    await prisma.$transaction(async (tx) => {
      await tx.reportePadre.update({
        where: { id },
        data: { fecha: new Date(data.fecha) }
      })

      await tx.reporteDetalle.deleteMany({
        where: { reporte_id: id }
      })

      await tx.reporteDetalle.createMany({
        data: data.medicos.map(medicoId => ({
          reporte_id: id,
          medico_id: medicoId
        }))
      })
    })

    await logAction('EDITAR_REPORTE', `Actualizó reporte ID: ${id}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error updating report:', error)
    return { success: false, error: 'Failed to update report' }
  }
}

export async function deleteReport(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    await prisma.reportePadre.delete({
      where: { id }
    })
    await logAction('ELIMINAR_REPORTE', `Eliminó reporte ID: ${id}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting report:', error)
    return { success: false, error: 'Failed to delete report' }
  }
}

export async function deleteReportsByDate(date: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    // Definir el rango del día
    const startDate = new Date(date + 'T00:00:00')
    const endDate = new Date(date + 'T23:59:59')

    await prisma.reportePadre.deleteMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    await logAction('ELIMINAR_REPORTES_FECHA', `Eliminó todos los reportes de la fecha: ${date}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting reports by date:', error)
    return { success: false, error: 'Error al eliminar los reportes de esta fecha' }
  }
}

export async function getReports(filters?: { startDate?: string; endDate?: string }) {
  const where: any = {}
  if (filters?.startDate && filters?.endDate) {
    where.fecha = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    }
  }

  return await prisma.reportePadre.findMany({
    where,
    include: {
      operador: {
        select: { nombre_completo: true }
      },
      detalles: {
        include: {
          medico: {
            include: { unidad: true }
          }
        },
        orderBy: [
          { medico: { unidad: { nombre: 'asc' } } },
          { medico: { nombre: 'asc' } }
        ]
      }
    },
    orderBy: { fecha: 'desc' }
  })
}

// --- UNIDADES ---

export async function getUnidades() {
  return await prisma.unidad.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      _count: {
        select: { medicos: true }
      }
    }
  })
}

export async function createUnidad(nombre: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    const unidad = await prisma.unidad.create({
      data: { nombre: nombre.trim().toUpperCase() }
    })
    await logAction('CREAR_UNIDAD', `Creó unidad: ${unidad.nombre}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/unidades')
    revalidatePath('/dashboard/medicos')
    return { success: true, data: unidad }
  } catch (error) {
    return { success: false, error: 'La unidad ya existe o hay un error.' }
  }
}

export async function updateUnidad(id: number, nombre: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    const unidad = await prisma.unidad.update({
      where: { id },
      data: { nombre: nombre.trim().toUpperCase() }
    })
    await logAction('EDITAR_UNIDAD', `Editó unidad ID: ${id} a ${unidad.nombre}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/unidades')
    revalidatePath('/dashboard/medicos')
    return { success: true, data: unidad }
  } catch (error) {
    return { success: false, error: 'Error al actualizar la unidad.' }
  }
}

export async function deleteUnidad(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    // Check if there are medicos
    const count = await prisma.catalogoMedico.count({
      where: { unidad_id: id }
    })

    if (count > 0) {
      return { success: false, error: `No se puede eliminar: tiene ${count} personas asignadas.` }
    }

    const unidad = await prisma.unidad.delete({
      where: { id }
    })
    await logAction('ELIMINAR_UNIDAD', `Eliminó unidad: ${unidad.nombre}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/unidades')
    revalidatePath('/dashboard/medicos')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al eliminar la unidad.' }
  }
}

// --- MEDICOS ---

export async function getMedicos() {
  return await prisma.catalogoMedico.findMany({
    include: { unidad: true },
    orderBy: [
      { unidad: { nombre: 'asc' } },
      { nombre: 'asc' }
    ]
  })
}

export async function createMedico(data: { nombre: string; telefono?: string; unidad_id: number; tipo: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    const operador = await prisma.operador.findUnique({
      where: { id: session.user.id }
    })

    if (!operador) {
      return { success: false, error: 'Sesión inválida. Por favor cierre sesión y vuelva a entrar.' }
    }

    const medico = await prisma.catalogoMedico.create({ 
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        unidad_id: data.unidad_id,
        tipo: data.tipo
      },
      include: { unidad: true }
    })
    await logAction('CREAR_MEDICO', `Creó personal: ${medico.nombre}`)
    revalidatePath('/dashboard/medicos')
    return { success: true, data: medico }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al crear médico' }
  }
}

export async function updateMedico(id: number, data: { nombre: string; telefono?: string; unidad_id: number; tipo: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    const medico = await prisma.catalogoMedico.update({
      where: { id },
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        unidad_id: data.unidad_id,
        tipo: data.tipo
      },
      include: { unidad: true }
    })
    await logAction('EDITAR_MEDICO', `Editó personal ID: ${id} (${medico.nombre})`)
    revalidatePath('/dashboard/medicos')
    return { success: true, data: medico }
  } catch (error) {
    return { success: false, error: 'Error al editar médico' }
  }
}

export async function deleteMedico(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    const medico = await prisma.catalogoMedico.delete({
      where: { id }
    })
    await logAction('ELIMINAR_MEDICO', `Eliminó personal: ${medico.nombre}`)
    revalidatePath('/dashboard/medicos')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se puede eliminar el personal porque tiene reportes asociados' }
  }
}

export async function importMedicos(data: { nombre: string; telefono: string; municipio_unidad: string; tipo?: string }[]) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    // 1. Get all units to map names to IDs
    const units = await prisma.unidad.findMany()
    const unitMap = new Map(units.map(u => [u.nombre.toUpperCase().trim(), u.id]))

    // 2. Fetch existing doctors to avoid duplicates
    const existingMedicos = await prisma.catalogoMedico.findMany({
      select: { nombre: true, telefono: true, unidad_id: true, tipo: true }
    })

    const existingKeys = new Set(
      existingMedicos.map(m => `${m.nombre.toUpperCase().trim()}|${m.unidad_id}|${(m.telefono || '').trim()}`)
    )

    // 3. Process new data, mapping municipio_unidad (text) to unidad_id (Int)
    const newData = []
    const skipped = []
    for (const m of data) {
      const unitId = unitMap.get(m.municipio_unidad.toUpperCase().trim())
      if (!unitId) {
        skipped.push({ ...m, reason: 'Unidad no encontrada' })
        continue
      }

      const key = `${m.nombre.toUpperCase().trim()}|${unitId}|${(m.telefono || '').trim()}`
      if (!existingKeys.has(key)) {
        newData.push({
          nombre: m.nombre,
          telefono: m.telefono,
          unidad_id: unitId,
          tipo: m.tipo || 'GENERAL'
        })
        existingKeys.add(key)
      } else {
        skipped.push({ ...m, reason: 'Duplicado' })
      }
    }

    if (newData.length === 0) {
      return { success: true, count: 0, skippedCount: skipped.length }
    }

    const result = await prisma.catalogoMedico.createMany({
      data: newData,
    })

    await logAction('IMPORTAR_MEDICOS', `Importó masivamente ${result.count} registros desde Excel. Omitidos: ${skipped.length}`)
    revalidatePath('/dashboard/medicos')
    return { success: true, count: result.count, skippedCount: skipped.length }
  } catch (error) {
    console.error('Import error:', error)
    return { success: false, error: 'Error al importar los datos.' }
  }
}

// --- LOGS ---

export async function getLogs() {
  try {
    if (!prisma.logAccion) return []
    return await prisma.logAccion.findMany({
      orderBy: { fecha: 'desc' },
      take: 100 // Limit to last 100 for performance
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return []
  }
}
