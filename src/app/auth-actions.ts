'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(state: any, formData: FormData) {
  const usuario = (formData.get('usuario') as string | null)?.trim()
  const password = formData.get('password') as string | null

  if (!usuario || !password) {
    return { error: 'Usuario y contraseña requeridos' }
  }

  const user = await prisma.operador.findUnique({
    where: { usuario },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Credenciales inválidas' }
  }

  // Create session
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const session = await encrypt({ user: { id: user.id, name: user.nombre_completo }, expires })

  cookies().set('session', session, { expires, httpOnly: true, path: '/' })
  
  redirect('/dashboard')
}

export async function logout() {
  cookies().set('session', '', { expires: new Date(0), path: '/' })
  redirect('/login')
}

export async function registerFirstUser(state: any, formData: FormData) {
  const nombre_completo = (formData.get('nombre_completo') as string | null)?.trim()
  const usuario = (formData.get('usuario') as string | null)?.trim()
  const password = formData.get('password') as string | null

  if (!nombre_completo || !usuario || !password) {
    return { error: 'Todos los campos son requeridos' }
  }

  const count = await prisma.operador.count()
  if (count > 0) {
    return { error: 'Ya existe un administrador registrado. Utilice el login.' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await prisma.operador.create({
      data: {
        nombre_completo,
        usuario,
        password: hashedPassword,
      },
    })
    return { success: true }
  } catch (error) {
    return { error: 'Error al crear el usuario. Intente nuevamente.' }
  }
}

