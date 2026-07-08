'use client'

import { useState, useEffect } from 'react'
import { useFormState } from 'react-dom'
import { login } from '@/app/auth-actions'
import { Loader2, LogIn, Stethoscope, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLoading } from '@/components/LoadingContext'

export default function LoginForm() {
  const [state, action, pending] = useFormState(login, null)
  const [showPassword, setShowPassword] = useState(false)
  const { setIsLoading } = useLoading()

  useEffect(() => {
    if (pending) {
      setIsLoading(true, 'Verificando credenciales...')
    } else {
      setIsLoading(false)
    }
  }, [pending, setIsLoading])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Stethoscope size={32} />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">SNC Medic</h1>
          <p className="mt-2 text-sm text-gray-600">Control Diario de Turnos Médicos</p>
        </div>

        <form action={action} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">Usuario</label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Introduzca su usuario"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {state?.error && (
            <p className="text-center text-sm font-medium text-red-600">{state.error}</p>
          )}

          <button
            disabled={pending}
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="mr-2 animate-spin" size={18} />
            ) : (
              <LogIn className="mr-2" size={18} />
            )}
            Iniciar Sesión
          </button>
        </form>

        <div className="text-center text-xs text-gray-400">
          Entorno Local Seguro - SNC Medic 2024
        </div>
      </motion.div>
    </div>
  )
}
