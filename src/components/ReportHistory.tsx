'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import { Calendar, User, Phone, MapPin, Trash2, Pencil, X, AlertCircle, Eye, Loader2, Building2, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { deleteReport, deleteReportsByDate } from '@/app/actions'
import ReportForm from './ReportForm'

interface Props {
  reports: any[]
  medicos: any[]
  unidades: any[]
}

function DeleteButton({ id, onDeleted }: { id: number, onDeleted: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar este reporte de turno?')) return
    
    setLoading(true)
    const result = await deleteReport(id)
    if (result.success) {
      onDeleted()
    } else {
      alert(result.error)
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
    >
      <Trash2 size={14} /> {loading ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}

function DeleteGroupButton({ date, onDeleted, showLabel = false }: { date: string, onDeleted: () => void, showLabel?: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleDeleteAll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const formattedDate = format(new Date(date + 'T12:00:00'), 'PPP', { locale: es })
    if (!confirm(`¿Está seguro de eliminar TODOS los reportes del día ${formattedDate}? Esta acción no se puede deshacer.`)) return
    
    setLoading(true)
    const result = await deleteReportsByDate(date)
    if (result.success) {
      onDeleted()
    } else {
      alert(result.error)
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDeleteAll}
      disabled={loading}
      title="Eliminar todos los reportes de este día"
      className={cn(
        "flex items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50",
        showLabel ? "px-3 py-1.5 gap-2 text-xs font-bold" : "h-8 w-8"
      )}
    >
      {loading ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
      {showLabel && (loading ? 'Eliminando...' : 'Eliminar Todo el Día')}
    </button>
  )
}

export default function ReportHistory({ reports = [], medicos = [], unidades = [] }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const [editingReport, setEditingReport] = useState<any | null>(null)
  const [viewingDate, setViewingDate] = useState<string | null>(null)
  const [showMissingModal, setShowMissingModal] = useState(false)

  const filteredReports = reports.filter(r => {
    const reportDate = new Date(r.fecha).toISOString().split('T')[0]
    if (dateFilter.start && reportDate < dateFilter.start) return false
    if (dateFilter.end && reportDate > dateFilter.end) return false
    return true
  })

  // Group reports by date
  const groupedReports = filteredReports.reduce((acc, report) => {
    const date = new Date(report.fecha).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(report)
    return acc
  }, {} as Record<string, any[]>)

  const sortedDates = Object.keys(groupedReports).sort((a, b) => b.localeCompare(a))

  // Total unique units in the system
  const totalUnits = unidades?.length || 0

  // --- Cálculo: Unidades Sin Reporte Hoy ---
  const todayStr = formatInTimeZone(new Date(), 'America/Managua', 'yyyy-MM-dd')
  const todayReports = reports.filter(r => new Date(r.fecha).toISOString().split('T')[0] === todayStr)
  const reportedTodayIds = new Set<number>(
    todayReports.flatMap(r => r.detalles.map((d: any) => d.medico?.unidad_id).filter(Boolean))
  )
  const missingUnidades = unidades.filter(u => !reportedTodayIds.has(u.id))
  const allReported = missingUnidades.length === 0

  return (
    <div className="space-y-6">
      {/* Header & Filtros */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Historial de Reportes</h2>
          <p className="text-sm text-gray-500">Consulta los turnos registrados por fecha</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Unidades Sin Reporte Hoy */}
          <button
            onClick={() => setShowMissingModal(true)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${
              allReported
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            {allReported
              ? <CheckCircle2 size={16} className="text-green-600" />
              : <AlertCircle size={16} className="text-amber-600 animate-pulse" />
            }
            {allReported
              ? 'Todas reportadas hoy'
              : `${missingUnidades.length} sin reporte hoy`
            }
          </button>

          {/* Filtro de fechas */}
          <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-1.5 transition-colors focus-within:ring-1 focus-within:ring-blue-500">
            <Calendar size={16} className="text-gray-400" />
            <input 
              type="date"
              className="bg-transparent text-xs outline-none"
              value={dateFilter.start}
              onChange={e => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
            />
            <span className="text-gray-300">al</span>
            <input 
              type="date"
              className="bg-transparent text-xs outline-none"
              value={dateFilter.end}
              onChange={e => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          {(dateFilter.start || dateFilter.end) && (
            <button 
              onClick={() => setDateFilter({ start: '', end: '' })}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Modal: Unidades Sin Reporte Hoy */}
      <AnimatePresence>
        {mounted && showMissingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header del modal */}
              <div className={`flex items-center justify-between p-6 ${allReported ? 'bg-green-50 border-b border-green-100' : 'bg-amber-50 border-b border-amber-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${allReported ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {allReported ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {allReported ? '¡Todas las unidades reportadas!' : 'Unidades sin reporte hoy'}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {format(new Date(todayStr + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMissingModal(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body del modal */}
              <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
                {allReported ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 size={44} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">¡Excelente cobertura!</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Las {totalUnits} unidades han reportado médico de turno hoy.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Pendientes de reporte
                      </p>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-700">
                        {missingUnidades.length} / {totalUnits}
                      </span>
                    </div>
                    {missingUnidades.map((u, i) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors"
                      >
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-black text-amber-800">
                          {i + 1}
                        </span>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <Building2 size={14} className="text-amber-600 flex-shrink-0" />
                          {u.nombre}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer del modal */}
              <div className="border-t p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowMissingModal(false)}
                  className="rounded-lg bg-gray-800 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards de fechas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedDates.map((date) => {
          const dayReports = groupedReports[date]
          
          // Count unique units that have reported at least one doctor for this date
          const reportedUnits = new Set(dayReports.flatMap((r: any) => r.detalles.map((d: any) => d.medico?.unidad_id).filter(Boolean)))
          const reportedCount = reportedUnits.size
          const notReportedCount = Math.max(0, totalUnits - reportedCount)

          return (
            <div 
              key={date}
              onClick={() => setViewingDate(date)}
              className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {format(new Date(date + 'T12:00:00'), 'PPP', { locale: es })}
                    </p>
                    <p className="text-xs text-gray-500">{dayReports.length} {dayReports.length === 1 ? 'reporte' : 'reportes'} de turno</p>
                  </div>
                </div>
                
                <DeleteGroupButton date={date} onDeleted={() => {}} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">Unidades Reportadas</p>
                  <p className="text-xl font-black text-green-700">{reportedCount}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Faltan Unidades</p>
                  <p className="text-xl font-black text-red-700">{notReportedCount}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-medium text-gray-400 group-hover:text-blue-600">
                <span className="flex items-center gap-1">
                  <Eye size={14} /> Ver detalles
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </div>
            </div>
          )
        })}
        {sortedDates.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 mb-4">
              <Calendar size={32} />
            </div>
            <p className="text-gray-500 italic">No se encontraron reportes en este rango de fechas.</p>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      <AnimatePresence>
        {mounted && viewingDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b p-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Médicos de Turno: {format(new Date(viewingDate + 'T12:00:00'), 'PPP', { locale: es })}
                  </h3>
                  <p className="text-sm text-gray-500">Detalles del personal reportado para esta fecha</p>
                </div>
                <div className="flex items-center gap-2">
                  <DeleteGroupButton date={viewingDate} showLabel onDeleted={() => setViewingDate(null)} />
                  <button 
                    onClick={() => setViewingDate(null)}
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                {groupedReports[viewingDate].map((report: any) => (
                  <div key={report.id} className="mb-8 last:mb-0">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Operador: {report.operador.nombre_completo}</p>
                          <p className="text-[10px] text-gray-500 font-medium">REPORTADO A LAS {format(new Date(report.fecha), 'pp')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingReport(report)
                            setViewingDate(null)
                          }}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <DeleteButton id={report.id} onDeleted={() => setViewingDate(null)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {report.detalles.map((d: any) => (
                        <div 
                          key={d.id} 
                          className={`group rounded-xl border p-4 shadow-sm ring-1 transition-all hover:shadow-md ${
                            !d.medico.telefono 
                              ? "bg-red-50 border-red-100 ring-red-500/30 hover:ring-red-500/50" 
                              : "bg-white border-white ring-black/5 hover:ring-blue-500/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-sm">{d.medico.nombre}</p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                              d.medico.tipo === 'SOCIAL' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {d.medico.tipo || 'GENERAL'}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2 text-xs text-gray-500">
                            <div className="flex items-center">
                              <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-md bg-gray-50 text-gray-400">
                                <Phone size={10} />
                              </div>
                              {d.medico.telefono || <span className="text-red-500 font-bold italic">SIN TELÉFONO</span>}
                            </div>
                            <div className="flex items-center">
                              <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-md bg-gray-50 text-gray-400">
                                <MapPin size={10} />
                              </div>
                              {d.medico.unidad?.nombre || 'Sin Unidad'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Edición */}
      <AnimatePresence>
        {mounted && editingReport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            >
              <ReportForm 
                medicos={medicos} 
                initialData={{
                  id: editingReport.id,
                  fecha: new Date(editingReport.fecha).toISOString().split('T')[0],
                  medicos: editingReport.detalles.map((d: any) => d.medico_id)
                }}
                onSuccess={() => setEditingReport(null)}
                onCancel={() => setEditingReport(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
