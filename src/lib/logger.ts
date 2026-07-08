import prisma from './prisma'
import { getSession } from './auth'

export async function logAction(accion: string, descripcion: string) {
  try {
    const session = await getSession()
    const usuario = session?.user?.name || 'Sistema'

    await prisma.logAccion.create({
      data: {
        usuario,
        accion,
        descripcion,
      },
    })
  } catch (error) {
    console.error('Failed to log action:', error)
  }
}
