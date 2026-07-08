'use client'

import { useState, useEffect } from 'react'
import { createReport, updateReport } from '@/app/actions'
import { CatalogoMedico } from '@prisma/client'
import { formatInTimeZone } from 'date-fns-tz'
import { Check, Loader2, Save, Search, UserPlus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  medicos: (CatalogoMedico & { unidad: { nombre: string } })[]
  unidades?: { id: number; nombre: string; _count?: { medicos: number } }[]
  initialData?: {
    id: number
    fecha: string
    medicos: number[]
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ReportForm({ medicos, unidades = [], initialData, onSuccess, onCancel }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialData?.medicos || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [municipioFilter, setMunicipioFilter] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fecha, setFecha] = useState(initialData?.fecha || formatInTimeZone(new Date(), 'America/Managua', 'yyyy-MM-dd'))
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const municipios = unidades.length > 0
    ? unidades.map(u => u.nombre).sort()
    : Array.from(new Set(medicos.map(m => m.unidad.nombre))).sort()

  const filteredMedicos = medicos.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    (m.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesMunicipio = !municipioFilter || m.unidad.nombre === municipioFilter
    return matchesSearch && matchesMunicipio
  }).sort((a, b) => {
    const unidadA = a.unidad.nombre.trim().toUpperCase()
    const unidadB = b.unidad.nombre.trim().toUpperCase()
    if (unidadA < unidadB) return -1
    if (unidadA > unidadB) return 1
    return a.nombre.trim().localeCompare(b.nombre.trim())
  })

  const toggleMedico = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.length === 0) {
      setMessage({ type: 'error', text: 'Debe seleccionar al menos una persona de turno' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const data = { fecha, medicos: selectedIds }
      const result = initialData 
        ? await updateReport(initialData.id, data)
        : await createReport(data)

      if (result.success) {
        setMessage({ type: 'success', text: initialData ? 'Reporte actualizado' : 'Reporte guardado' })
        if (!initialData) setSelectedIds([])
        if (onSuccess) setTimeout(onSuccess, 1000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al procesar' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("rounded-xl border bg-white p-6 shadow-sm", initialData && "border-none shadow-none p-0")}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center text-xl font-bold text-gray-800">
          <Save className="mr-2 text-blue-600" size={24} />
          {initialData ? 'Editar Reporte' : 'Registrar Reporte de Turno'}
        </h2>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Fecha del Turno</label>
            <input 
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Municipio / Unidad</label>
            <select
              value={municipioFilter}
              onChange={(e) => setMunicipioFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            >
              <option value="">Todas las unidades</option>
              {municipios.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Buscar por Nombre</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex justify-between text-sm font-semibold text-gray-700">
            <span>Seleccionar Personal de Turno</span>
            <span className="text-blue-600">{selectedIds.length} seleccionados</span>
          </label>
          
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredMedicos.map((medico) => (
                <button
                  key={medico.id}
                  type="button"
                  onClick={() => toggleMedico(medico.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                    selectedIds.includes(medico.id) 
                      ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" 
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  )}
                >
                  <div>
                    <p className="font-medium leading-none">{medico.nombre}</p>
                    <p className="mt-1 text-xs text-gray-500">{medico.unidad?.nombre || 'Sin Unidad'}</p>
                  </div>
                  {selectedIds.includes(medico.id) && (
                    <div className="rounded-full bg-blue-600 p-1 text-white">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              ))}
              {medicos.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <p className="text-sm text-gray-500 mb-4">No hay personal registrado en el sistema.</p>
                  <Link 
                    href="/dashboard/medicos"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Ir a Registrar Personal
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mounted && message && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "rounded-lg p-3 text-sm font-medium mb-4",
                message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                {message.text}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 animate-spin" size={20} />
          ) : (
            <UserPlus className="mr-2" size={20} />
          )}
          {initialData ? 'Actualizar Reporte' : 'Guardar Reporte'}
        </button>
      </form>
    </div>
  )
}
