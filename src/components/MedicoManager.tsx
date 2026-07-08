'use client'

import { useState, useRef, useEffect } from 'react'
import { createMedico, updateMedico, deleteMedico, importMedicos } from '@/app/actions'
import { Plus, Pencil, Trash2, X, Check, Loader2, FileSpreadsheet, Download, Upload, Building2, AlertCircle, PhoneOff, Filter } from 'lucide-react'
import { generateMedicoTemplate, parseMedicoExcel } from '@/lib/excel-utils'
import Link from 'next/link'

interface Medico {
  id: number
  nombre: string
  telefono: string | null
  unidad_id: number
  unidad: {
    id: number
    nombre: string
  }
  tipo: string
}

interface Unidad {
  id: number
  nombre: string
}

export default function MedicoManager({ initialMedicos, unidades }: { initialMedicos: Medico[], unidades: Unidad[] }) {
  const [medicos, setMedicos] = useState(initialMedicos)
  const medicosSinTelefono = medicos.filter(m => !m.telefono).length
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null)
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [error, setError] = useState('')
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [filterSinTelefono, setFilterSinTelefono] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sonido de alerta
  const playAlertSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5)
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  // Alerta automática al cargar
  useEffect(() => {
    if (medicosSinTelefono > 0) {
      const timer = setTimeout(() => {
        setShowWarningModal(true)
        try { playAlertSound() } catch(e) { console.error("Audio error", e) }
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [medicosSinTelefono])

  // Ordenamiento garantizado (por unidad y luego nombre)
  const sortedMedicos = [...medicos]
    .sort((a, b) => {
      const unidadA = a.unidad.nombre.trim().toUpperCase()
      const unidadB = b.unidad.nombre.trim().toUpperCase()
      if (unidadA < unidadB) return -1
      if (unidadA > unidadB) return 1
      return a.nombre.trim().localeCompare(b.nombre.trim())
    })
    .filter(m => !filterSinTelefono || !m.telefono)

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    unidad_id: unidades[0]?.id || 0,
    tipo: 'GENERAL'
  })

  // ... previous handlers ...

  const handleDownloadTemplate = () => {
    const blob = generateMedicoTemplate()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_medicos_snc_medic.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    try {
      const data = await parseMedicoExcel(file)
      if (data.length === 0) {
        alert('No se encontraron datos válidos en el archivo.')
        return
      }

      if (confirm(`Se importarán ${data.length} médicos. ¿Desea continuar?`)) {
        const result = await importMedicos(data)
        if (result.success) {
          let msg = `Importación completada: ${result.count} médicos añadidos.`
          if (result.skippedCount && result.skippedCount > 0) {
            msg += `\n${result.skippedCount} registros fueron omitidos (duplicados o unidad no encontrada).`
          }
          alert(msg)
          window.location.reload()
        } else {
          alert(result.error)
        }
      }
    } catch (err) {
      alert('Error al leer el archivo Excel.')
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleOpenModal = (medico?: Medico) => {
    if (medico) {
      setEditingMedico(medico)
      setFormData({
        nombre: medico.nombre,
        telefono: medico.telefono || '',
        unidad_id: medico.unidad_id,
        tipo: medico.tipo || 'GENERAL'
      })
    } else {
      setEditingMedico(null)
      setFormData({ 
        nombre: '', 
        telefono: '', 
        unidad_id: unidades[0]?.id || 0,
        tipo: 'GENERAL'
      })
    }
    setIsModalOpen(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const action = editingMedico 
      ? updateMedico(editingMedico.id, formData) 
      : createMedico(formData)

    const result = await action
    if (result.success) {
      if (editingMedico) {
        const updatedMedico = result.data as Medico
        setMedicos(medicos.map(m => m.id === editingMedico.id ? updatedMedico : m))
      } else if (result.data) {
        setMedicos([...medicos, result.data as Medico])
      }
      setIsModalOpen(false)
    } else {
      setError(result.error || 'Ocurrió un error')
    }
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este médico?')) return
    
    const result = await deleteMedico(id)
    if (result.success) {
      setMedicos(medicos.filter(m => m.id !== id))
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catálogo de Médicos</h2>
          <p className="text-sm text-gray-500">Gestione la lista de personal disponible</p>
          <Link href="/dashboard/unidades" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 mt-1">
            <Building2 size={12} /> Gestionar Unidades / Municipios
          </Link>
          {medicosSinTelefono > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-500/20">
              <AlertCircle size={14} /> Atencion: Hay {medicosSinTelefono} médicos sin número telefónico.
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Filtro Sin Teléfono */}
          <button
            onClick={() => setFilterSinTelefono(f => !f)}
            title={filterSinTelefono ? 'Mostrando solo médicos sin teléfono. Clic para ver todos.' : 'Filtrar solo médicos sin teléfono'}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
              filterSinTelefono
                ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 ring-2 ring-red-300'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700'
            }`}
          >
            <PhoneOff size={16} />
            Sin Teléfono
            <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
              filterSinTelefono ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
            }`}>
              {medicosSinTelefono}
            </span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Plantilla
          </button>
          <div className="relative">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImportExcel}
              className="hidden" 
              accept=".xlsx,.xls"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {importLoading ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
              Importar Excel
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Nuevo Médico
          </button>
        </div>
      </div>

      {/* Banner del filtro activo */}
      {filterSinTelefono && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-red-700">
            <Filter size={16} />
            Filtro activo: mostrando {sortedMedicos.length} médico{sortedMedicos.length !== 1 ? 's' : ''} sin teléfono registrado
          </div>
          <button
            onClick={() => setFilterSinTelefono(false)}
            className="text-xs font-semibold text-red-500 hover:text-red-700 underline"
          >
            Limpiar filtro
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Municipio / Unidad</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedMedicos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                  No hay médicos registrados.
                </td>
              </tr>
            ) : (
                sortedMedicos.map((medico) => {

                  return (
                    <tr 
                      key={medico.id} 
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{medico.nombre}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {medico.telefono || <span className="text-red-400 italic text-xs">Sin teléfono</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          medico.tipo === 'SOCIAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {medico.tipo || 'GENERAL'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{medico.unidad.nombre}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(medico)}
                            className="rounded-md p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(medico.id)}
                            className="rounded-md p-2 text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )
            }
          </tbody>

        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingMedico ? 'Editar Médico' : 'Nuevo Médico'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. Dr. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono (Opcional)</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej. 8888-8888"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Municipio / Unidad</label>
                <select
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.unidad_id}
                  onChange={(e) => setFormData({ ...formData, unidad_id: parseInt(e.target.value) })}
                >
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Médico</label>
                <select
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="GENERAL">MÉDICO GENERAL</option>
                  <option value="SOCIAL">MÉDICO SOCIAL</option>
                </select>
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
                  {editingMedico ? 'Guardar Cambios' : 'Crear Médico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Warning Modal */}
      {mounted && showWarningModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border-4 border-red-500 animate-bounce-short">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 animate-pulse">
                <AlertCircle size={48} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase">¡Atención Crítica!</h3>
              <p className="text-gray-600 mb-6 font-medium">
                Se han detectado <span className="text-red-600 font-bold text-xl">{medicosSinTelefono}</span> médicos que <span className="font-bold underline text-red-600">no tienen número de teléfono</span> registrado.
              </p>
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full rounded-xl bg-red-600 py-4 text-lg font-black text-white shadow-lg hover:bg-red-700 transition-all active:scale-95"
              >
                ENTENDIDO, VOY A CORREGIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

