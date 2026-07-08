'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { registerFirstUser } from '@/app/auth-actions'
import { Loader2, UserPlus, Stethoscope, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function SetupForm() {
  const [state, action, pending] = useFormState(registerFirstUser, null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  if (state?.success) {
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-2xl border border-blue-100"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4 ring-4 ring-blue-50">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Configuración Inicial</h1>
          <p className="mt-2 text-sm text-gray-500">Bienvenido a SNC Medic. Por favor, registre el primer administrador del sistema.</p>
        </div>

        <form action={action} className="mt-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre_completo" className="block text-sm font-bold text-gray-700">Nombre Completo</label>
              <input
                id="nombre_completo"
                name="nombre_completo"
                type="text"
                required
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-sm"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label htmlFor="usuario" className="block text-sm font-bold text-gray-700">Usuario de Acceso</label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                required
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-sm"
                placeholder="Ej. jperez"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700">Contraseña</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-12 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Stethoscope size={12} className="text-blue-500"/>
                Guarde bien esta contraseña.
              </p>
            </div>
          </div>

          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600 border border-red-100">
              {state.error}
            </div>
          )}

          <button
            disabled={pending}
            type="submit"
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <Loader2 className="mr-2 animate-spin" size={18} />
            ) : (
              <UserPlus className="mr-2" size={18} />
            )}
            Crear Administrador
          </button>
        </form>
      </motion.div>
    </div>
  )
}
