'use client'

import { useState } from 'react'
import { createUnidad, updateUnidad, deleteUnidad } from '@/app/actions'
import { Plus, Pencil, Trash2, X, Check, Loader2, Building2 } from 'lucide-react'

interface Unidad {
  id: number
  nombre: string
  _count?: {
    medicos: number
  }
}

export default function UnidadManager({ initialUnidades }: { initialUnidades: Unidad[] }) {
  const [unidades, setUnidades] = useState(initialUnidades)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nombre, setNombre] = useState('')

  const handleOpenModal = (unidad?: Unidad) => {
    if (unidad) {
      setEditingUnidad(unidad)
      setNombre(unidad.nombre)
    } else {
      setEditingUnidad(null)
      setNombre('')
    }
    setIsModalOpen(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    
    setLoading(true)
    setError('')

    const action = editingUnidad 
      ? updateUnidad(editingUnidad.id, nombre) 
      : createUnidad(nombre)

    const result = await action
    if (result.success) {
      if (editingUnidad) {
        setUnidades(unidades.map(u => u.id === editingUnidad.id ? { ...u, nombre: (result.data as any).nombre } : u))
      } else if (result.data) {
        setUnidades([...unidades, result.data as any].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      }
      setIsModalOpen(false)
    } else {
      setError(result.error || 'Ocurrió un error')
    }
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    const unidad = unidades.find(u => u.id === id)
    if (!unidad) return

    if (!confirm(`¿Está seguro de eliminar la unidad "${unidad.nombre}"?`)) return
    
    const result = await deleteUnidad(id)
    if (result.success) {
      setUnidades(unidades.filter(u => u.id !== id))
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Unidades / Municipios</h2>
          <p className="text-sm text-gray-500">Administre los puntos de atención disponibles</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nueva Unidad
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {unidades.map((unidad) => (
          <div 
            key={unidad.id} 
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{unidad.nombre}</h3>
                <p className="text-xs text-gray-500">{unidad._count?.medicos || 0} Personal asignado</p>
              </div>
            </div>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenModal(unidad)}
                className="rounded-md p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                title="Editar"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => handleDelete(unidad.id)}
                className="rounded-md p-2 text-red-600 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {unidades.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay unidades</h3>
          <p className="mt-1 text-sm text-gray-500">Comience creando una nueva unidad para el catálogo.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUnidad ? 'Editar Unidad' : 'Nueva Unidad'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de la Unidad / Municipio</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 uppercase focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. CHICHIGALPA"
                />
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  {editingUnidad ? 'Guardar Cambios' : 'Crear Unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
