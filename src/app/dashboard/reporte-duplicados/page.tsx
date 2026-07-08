'use client'

import { useState, useEffect } from 'react'
import { getMedicos, getUnidades } from '@/app/actions'
import { 
  Printer, 
  Stethoscope, 
  ChevronLeft, 
  Users,
  Building2,
  Phone,
  Tag,
  FileSpreadsheet,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { exportToExcel } from '@/lib/excel-utils'

export default function ReporteDuplicadosPage() {
  const [medicos, setMedicos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'NAME' | 'PHONE'>('ALL')

  useEffect(() => {
    async function fetchData() {
      const [m, u] = await Promise.all([getMedicos(), getUnidades()])
      setMedicos(m)
      setUnidades(u)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Logic to find duplicates
  const getDuplicates = () => {
    const phoneCounts: Record<string, number> = {}
    const nameCounts: Record<string, number> = {}

    medicos.forEach(m => {
      const phone = (m.telefono || '').trim()
      const name = m.nombre.trim().toUpperCase()
      if (phone) phoneCounts[phone] = (phoneCounts[phone] || 0) + 1
      if (name) nameCounts[name] = (nameCounts[name] || 0) + 1
    })

    return medicos.filter(m => {
      const phone = (m.telefono || '').trim()
      const name = m.nombre.trim().toUpperCase()
      const isDuplicatePhone = phone ? phoneCounts[phone] > 1 : false
      const isDuplicateName = nameCounts[name] > 1

      const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (m.telefono?.includes(searchTerm) ?? false)

      let matchesFilter = false
      if (filterType === 'ALL') matchesFilter = isDuplicatePhone || isDuplicateName
      if (filterType === 'NAME') matchesFilter = isDuplicateName
      if (filterType === 'PHONE') matchesFilter = isDuplicatePhone

      return matchesFilter && matchesSearch
    }).sort((a, b) => {
        // Sort by name primarily to group potential duplicates together
        return a.nombre.trim().localeCompare(b.nombre.trim())
    })
  }

  const duplicates = getDuplicates()

  const handleExportExcel = () => {
    const dataToExport = duplicates.map(m => ({
      'NOMBRE COMPLETO': m.nombre,
      'TELÉFONO': m.telefono || 'SIN TELÉFONO',
      'TIPO': m.tipo || 'GENERAL',
      'UNIDAD / MUNICIPIO': m.unidad.nombre,
      'MOTIVO': (duplicates.filter(d => d.nombre.trim().toUpperCase() === m.nombre.trim().toUpperCase()).length > 1 ? 'Nombre Duplicado ' : '') + 
                (m.telefono && duplicates.filter(d => d.telefono?.trim() === m.telefono?.trim()).length > 1 ? 'Teléfono Duplicado' : '')
    }))
    
    exportToExcel(
      dataToExport, 
      `Reporte_Duplicados_${format(new Date(), 'yyyy-MM-dd')}`, 
      'SNC SILAIS CHINADEGA - REPORTE DE DATOS DUPLICADOS'
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
            <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-200">
              <AlertTriangle size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">SNC Medic</h1>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reporte de Datos Duplicados</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/medicos"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={18} />
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Alerts & Info */}
        <div className="mb-6 rounded-2xl border-2 border-red-100 bg-red-50/50 p-6 flex flex-col md:flex-row items-center gap-6 print:hidden">
            <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg font-black text-red-900 uppercase">Detección de Registros Duplicados</h2>
                <p className="text-sm text-red-700 font-medium">Este reporte identifica automáticamente al personal que comparte el mismo nombre o número telefónico. Revise estos casos para mantener la integridad de los datos.</p>
            </div>
            <div className="bg-white rounded-xl px-6 py-3 border border-red-200 shadow-sm text-center">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Total Duplicados</p>
                <p className="text-3xl font-black text-red-600 leading-none">{duplicates.length}</p>
            </div>
        </div>

        {/* Filters - Not printed */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm lg:flex-row lg:items-end print:hidden">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Filtrar en duplicados</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Nombre o teléfono..."
                className="w-full rounded-lg border bg-gray-50 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full lg:w-64 space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Criterio de Duplicidad</label>
            <div className="flex bg-gray-50 p-1 rounded-lg border gap-1">
                <button 
                    onClick={() => setFilterType('ALL')}
                    className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'ALL' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Todos
                </button>
                <button 
                    onClick={() => setFilterType('NAME')}
                    className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'NAME' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Nombre
                </button>
                <button 
                    onClick={() => setFilterType('PHONE')}
                    className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'PHONE' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Teléfono
                </button>
            </div>
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
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-red-700 transition-all active:scale-95"
            >
              <Printer size={18} />
              Imprimir
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden print:border-none print:shadow-none">
          <div className="hidden print:block p-8 border-b-2 mb-8 border-red-100">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-red-900 leading-none">SNC SILAIS CHINADEGA</h1>
                <p className="text-md font-bold text-gray-500 uppercase tracking-widest mt-1">REPORTE DE PERSONAL CON DATOS DUPLICADOS</p>
              </div>
              <div className="text-right text-xs font-semibold text-gray-400">
                <p>FECHA: {format(new Date(), 'dd/MM/yyyy')}</p>
                <p>REGISTROS ENCONTRADOS: {duplicates.length}</p>
              </div>
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 print:bg-white print:border-b-2">
              <tr>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Unidad / Municipio</th>
                <th className="px-6 py-4 text-right">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {duplicates.map((medico, idx) => {
                  const isDupName = duplicates.filter(d => d.nombre.trim().toUpperCase() === medico.nombre.trim().toUpperCase()).length > 1
                  const isDupPhone = medico.telefono && duplicates.filter(d => d.telefono?.trim() === medico.telefono?.trim()).length > 1

                  return (
                    <tr key={medico.id} className="hover:bg-red-50/30 transition-colors print:break-inside-avoid">
                      <td className={`px-6 py-4 font-bold ${isDupName ? 'text-red-700' : 'text-gray-900'} flex items-center gap-2`}>
                        <Users size={14} className="text-gray-300 print:hidden" />
                        {medico.nombre}
                      </td>
                      <td className={`px-6 py-4 ${isDupPhone ? 'font-bold text-red-700' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-gray-300 print:hidden" />
                          {medico.telefono || <span className="text-gray-300 italic">N/A</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                          medico.tipo === 'SOCIAL' ? 'bg-purple-100 text-purple-700' :
                          medico.tipo === 'ENFERMERIA' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          <Tag size={10} className="print:hidden" />
                          {medico.tipo || 'GENERAL'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Building2 size={12} className="text-gray-300 print:hidden" />
                          {medico.unidad.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                            {isDupName && <span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Nombre Repetido</span>}
                            {isDupPhone && <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">Teléfono Repetido</span>}
                        </div>
                      </td>
                    </tr>
                  )
              })}
              {duplicates.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Filter size={48} className="opacity-20 text-green-500" />
                      <p className="font-bold text-gray-500">¡Excelente! No se encontraron datos duplicados</p>
                      <p className="text-xs">Todos los registros parecen ser únicos bajo los criterios seleccionados.</p>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <Stethoscope className="h-8 w-8 animate-spin text-red-200" />
                        <p className="text-xs font-bold text-gray-400 uppercase animate-pulse">Analizando registros...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="hidden print:block mt-8 text-center text-[10px] text-gray-400 pb-8">
            SNC SILAIS CHINADEGA - Reporte de Integridad de Datos - Confidencial
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
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  )
}
