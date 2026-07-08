'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import LoadingOverlay from './LoadingOverlay'
import { usePathname } from 'next/navigation'

interface LoadingContextType {
  setIsLoading: (loading: boolean, message?: string) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('Procesando...')
  const pathname = usePathname()

  const setIsLoading = (value: boolean, message?: string) => {
    if (message) setMsg(message)
    else setMsg('Procesando...')
    setLoading(value)
  }

  // Ocultar spinner cuando cambia la ruta
  useEffect(() => {
    setLoading(false)
  }, [pathname])

  // Detectar clics en enlaces para mostrar el spinner
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const anchor = target.closest('a')

      if (anchor && 
          anchor.href && 
          anchor.href.startsWith(window.location.origin) && 
          !anchor.href.includes('#') &&
          anchor.target !== '_blank') {
        setIsLoading(true, 'Cargando...')
      }
    }

    window.addEventListener('click', handleAnchorClick)
    return () => window.removeEventListener('click', handleAnchorClick)
  }, [])

  return (
    <LoadingContext.Provider value={{ setIsLoading }}>
      {children}
      <LoadingOverlay isLoading={loading} message={msg} />
    </LoadingContext.Provider>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) throw new Error('useLoading must be used within LoadingProvider')
  return context
}
