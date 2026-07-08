'use client'

import { useState, useEffect } from 'react'
import { getMedicos, getUnidades } from '@/app/actions'
import { 
  Printer, 
  Stethoscope, 
  ChevronLeft, 
  Search,
  Users,
  Building2,
  Phone,
  Tag,
  FileSpreadsheet
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { exportToExcel } from '@/lib/excel-utils'

export default function ReporteMedicosPage() {
  const [medicos, setMedicos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('TODOS')
  const [unidadFilter, setUnidadFilter] = useState('TODAS')

  useEffect(() => {
    async function fetchData() {
      const [m, u] = await Promise.all([getMedicos(), getUnidades()])
      setMedicos(m)
      setUnidades(u)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredMedicos = medicos.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                    (m.telefono?.includes(searchTerm) ?? false)
    const matchesTipo = tipoFilter === 'TODOS' || m.tipo === tipoFilter
    const matchesUnidad = unidadFilter === 'TODAS' || String(m.unidad_id) === unidadFilter
    return matchesSearch && matchesTipo && matchesUnidad
  }).sort((a, b) => {
    const unidadA = a.unidad.nombre.trim().toUpperCase()
    const unidadB = b.unidad.nombre.trim().toUpperCase()
    if (unidadA < unidadB) return -1
    if (unidadA > unidadB) return 1
    return a.nombre.trim().localeCompare(b.nombre.trim())
  })

  const handleExportExcel = () => {
    const dataToExport = filteredMedicos.map(m => ({
      'NOMBRE COMPLETO': m.nombre,
      'TELÉFONO': m.telefono || 'SIN TELÉFONO',
      'TIPO': m.tipo || 'GENERAL',
      'UNIDAD / MUNICIPIO': m.unidad.nombre
    }))
    
    exportToExcel(
      dataToExport, 
      `Catalogo_Medicos_${format(new Date(), 'yyyy-MM-dd')}`, 
      'SNC SILAIS CHINADEGA - CATÁLOGO GENERAL DE MÉDICOS'
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header - Not printed */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Stethoscope size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">SNC Medic</h1>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Catálogo General de Personal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={18} />
              Volver
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters - Not printed */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm lg:flex-row lg:items-end print:hidden">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Buscar Médico</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Nombre o teléfono..."
                className="w-full rounded-lg border bg-gray-50 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full lg:w-48 space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Tipo</label>
            <select 
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="GENERAL">Médico General</option>
              <option value="SOCIAL">Médico Social</option>
            </select>
          </div>

          <div className="w-full lg:w-64 space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Unidad / Municipio</label>
            <select 
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-ellipsis overflow-hidden"
              value={unidadFilter}
              onChange={e => setUnidadFilter(e.target.value)}
            >
              <option value="TODAS">Todas las unidades</option>
              {unidades.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button 
              onClick={handleExportExcel}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-6 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 transition-all active:scale-95 shadow-sm"
            >
              <FileSpreadsheet size={18} />
              Excel
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-800 transition-all active:scale-95"
            >
              <Printer size={18} />
              Imprimir
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden print:border-none print:shadow-none">
          <div className="hidden print:block p-8 border-b-2 mb-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-blue-900 leading-none">SNC SILAIS CHINADEGA</h1>
                <p className="text-md font-bold text-gray-500 uppercase tracking-widest mt-1">CATÁLOGO GENERAL DE MÉDICOS</p>
              </div>
              <div className="text-right text-xs font-semibold text-gray-400">
                <p>FECHA: {format(new Date(), 'dd/MM/yyyy')}</p>
                <p>MÉDICOS EN LISTA: {filteredMedicos.length}</p>
              </div>
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 print:bg-white print:border-b-2">
              <tr>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Unidad / Municipio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMedicos.map((medico) => (
                <tr key={medico.id} className="hover:bg-gray-50 transition-colors print:break-inside-avoid">
                  <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                    <Users size={14} className="text-gray-300 print:hidden" />
                    {medico.nombre}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-gray-300 print:hidden" />
                      {medico.telefono}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      medico.tipo === 'SOCIAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Tag size={10} className="print:hidden" />
                      {medico.tipo || 'GENERAL'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    <div className="flex items-center justify-end gap-2">
                      <Building2 size={12} className="text-gray-300 print:hidden" />
                      {medico.unidad.nombre}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMedicos.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Users size={48} className="opacity-20" />
                      <p className="font-medium">No se encontraron médicos con los filtros seleccionados</p>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Building2 className="mx-auto h-8 w-8 animate-spin text-blue-200" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="hidden print:block mt-8 text-center text-[10px] text-gray-400 pb-8">
            SNC SILAIS CHINADEGA - Sistema de Gestión de Médicos de Turno
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          header, .filters-container, button {
            display: none !important;
          }
          .mx-auto {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
