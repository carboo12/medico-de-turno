'use client'

import { useState, useEffect } from 'react'
import { getReports, getMedicos, getUnidades } from '@/app/actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Calendar, 
  Printer, 
  FileSpreadsheet, 
  Stethoscope, 
  ChevronLeft, 
  Search,
  Activity,
  User,
  TrendingDown,
  TrendingUp,
  Building2
} from 'lucide-react'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'
import StatsCharts from '@/components/StatsCharts'
import { useLoading } from '@/components/LoadingContext'

export default function ReportesPage() {
  const { setIsLoading } = useLoading()
  const [reports, setReports] = useState<any[]>([])
  const [medicosCount, setMedicosCount] = useState(0)
  const [allUnidades, setAllUnidades] = useState<{ id: number; nombre: string }[]>([])
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true, 'Cargando datos...')
    const [reportsData, medicosData, unidadesData] = await Promise.all([
      getReports({ startDate: dateRange.start, endDate: dateRange.end }),
      getMedicos(),
      getUnidades()
    ])
    setReports(reportsData)
    setMedicosCount(medicosData.length)
    setAllUnidades(unidadesData)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [dateRange])

  // Conteo de reportes por unidad
  const statsDataMap = new Map<string, { count: number; id: number }>()
  reports.forEach(report => {
    report.detalles.forEach((detalle: any) => {
      const unit = detalle.medico.unidad.nombre
      const unitId = detalle.medico.unidad.id
      const prev = statsDataMap.get(unit) || { count: 0, id: unitId }
      statsDataMap.set(unit, { count: prev.count + 1, id: unitId })
    })
  })

  const statsData = Array.from(statsDataMap.entries())
    .map(([unit, { count }]) => ({ unit, count }))
    .sort((a, b) => b.count - a.count)

  // Ranking completo: incluir unidades con 0 reportes
  const rankingMap = new Map<number, { nombre: string; count: number }>()
  allUnidades.forEach(u => rankingMap.set(u.id, { nombre: u.nombre, count: 0 }))
  reports.forEach(report => {
    report.detalles.forEach((detalle: any) => {
      const uid = detalle.medico.unidad.id
      const prev = rankingMap.get(uid)
      if (prev) rankingMap.set(uid, { ...prev, count: prev.count + 1 })
    })
  })
  const rankingList = Array.from(rankingMap.values()).sort((a, b) => a.count - b.count)
  const menosReportadas = [...rankingList] // ya ordenada asc
  const masReportadas = [...rankingList].sort((a, b) => b.count - a.count)

  const handleExportExcel = () => {
    setIsLoading(true, 'Generando archivo Excel...')
    const dataToExport = reports.flatMap(report => 
      report.detalles.map((d: any) => ({
        'FECHA TURNO': format(new Date(report.fecha), 'dd/MM/yyyy'),
        'MÉDICO': d.medico.nombre,
        'TELÉFONO': d.medico.telefono || 'S/T',
        'MUNICIPIO / UNIDAD': d.medico.unidad.nombre,
        'TIPO': d.medico.tipo || 'GENERAL',
        'OPERADOR': report.operador.nombre_completo,
        'HORA REGISTRO': format(new Date(report.fecha), 'HH:mm')
      }))
    )
    exportToExcel(
      dataToExport, 
      `Reporte_Turnos_${dateRange.start}_${dateRange.end}`, 
      'SNC SILAIS CHINADEGA - REPORTE DETALLADO DE TURNOS'
    )
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handlePrint = () => {
    setIsLoading(true, 'Preparando impresión...')
    setTimeout(() => {
      setIsLoading(false)
      window.print()
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Stethoscope size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">SNC Medic</h1>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reportes y Estadísticas</p>
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 print:p-0 print:m-0">
        {/* Print-only Header */}
        <div className="hidden print:block mb-8 border-b-2 pb-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-blue-900 leading-none">SNC SILAIS CHINADEGA</h1>
              <p className="text-md font-bold text-gray-500 uppercase tracking-widest mt-1">REPORTE DE MEDICO DE TURNO</p>
            </div>
            <div className="text-right text-xs font-semibold text-gray-400">
              <p>FECHA: {format(new Date(), 'dd/MM/yyyy')}</p>
              <p>RANGO: {format(new Date(dateRange.start), 'dd/MM/yyyy')} - {format(new Date(dateRange.end), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Desde</label>
              <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Calendar size={16} className="text-gray-400" />
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent text-sm outline-none font-medium"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Hasta</label>
              <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Calendar size={16} className="text-gray-400" />
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent text-sm outline-none font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t pt-4 sm:border-t-0 sm:pt-0">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 transition-all"
            >
              <FileSpreadsheet size={18} />
              Excel
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-800 transition-all active:scale-95"
            >
              <Printer size={18} />
              Imprimir
            </button>
          </div>
        </div>

        {/* Gráficos */}
        <section className="mb-10 print:break-inside-avoid print:mb-0">
          <div className="mb-6 flex items-center gap-2 print:mb-4">
            <Activity className="text-blue-600 print:hidden" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 print:text-lg">Gráficos de Productividad</h2>
          </div>
          <StatsCharts data={statsData} />
        </section>

        {/* ===== RANKING: Menos Reportadas ===== */}
        <section className="mb-10 print:hidden">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <TrendingDown size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Unidades que Menos se Reportan</h2>
              <p className="text-xs text-gray-500">Ordenadas de menor a mayor número de reportes en el período</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Municipio / Unidad</th>
                  <th className="px-4 py-3 text-right">Total Reportes</th>
                  <th className="px-4 py-3 text-right">Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {menosReportadas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400 italic">
                      Sin datos en el período seleccionado
                    </td>
                  </tr>
                ) : (
                  menosReportadas.map((u, i) => {
                    const maxCount = masReportadas[0]?.count || 1
                    const pct = maxCount > 0 ? Math.round((u.count / maxCount) * 100) : 0
                    const isZero = u.count === 0
                    return (
                      <tr key={u.nombre} className={`transition-colors ${isZero ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                            isZero ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className={isZero ? 'text-red-500' : 'text-gray-400'} />
                            <span className={`font-semibold ${isZero ? 'text-red-700' : 'text-gray-800'}`}>{u.nombre}</span>
                            {isZero && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 uppercase">
                                Sin reporte
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-lg font-black ${isZero ? 'text-red-600' : 'text-gray-700'}`}>
                            {u.count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full transition-all ${isZero ? 'bg-red-400' : 'bg-orange-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-500 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== RANKING: Más Reportadas ===== */}
        <section className="mb-10 print:hidden">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Unidades que Más se Reportan</h2>
              <p className="text-xs text-gray-500">Ordenadas de mayor a menor número de reportes en el período</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Municipio / Unidad</th>
                  <th className="px-4 py-3 text-right">Total Reportes</th>
                  <th className="px-4 py-3 text-right">Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {masReportadas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400 italic">
                      Sin datos en el período seleccionado
                    </td>
                  </tr>
                ) : (
                  masReportadas.map((u, i) => {
                    const maxCount = masReportadas[0]?.count || 1
                    const pct = maxCount > 0 ? Math.round((u.count / maxCount) * 100) : 0
                    const isTop = i < 3 && u.count > 0
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <tr key={u.nombre} className={`transition-colors ${isTop ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          {isTop ? (
                            <span className="text-lg">{medals[i]}</span>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-600">
                              {i + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className={isTop ? 'text-green-600' : 'text-gray-400'} />
                            <span className={`font-semibold ${isTop ? 'text-green-800' : 'text-gray-800'}`}>{u.nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-lg font-black ${isTop ? 'text-green-600' : 'text-gray-700'}`}>
                            {u.count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full transition-all ${isTop ? 'bg-green-500' : 'bg-blue-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-500 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tabla Detallada */}
        <section className="print:mt-8">
          <div className="mb-6 flex items-center gap-2 print:mb-4">
            <User className="text-blue-600 print:hidden" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 print:text-lg">Listado Detallado de Turnos</h2>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm print:border-none print:shadow-none">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 print:bg-white print:border-b-2">
                <tr>
                  <th className="px-6 py-4">Fecha Turno</th>
                  <th className="px-6 py-4">Médico</th>
                  <th className="px-6 py-4">Municipio / Unidad</th>
                  <th className="px-6 py-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.flatMap(report => (
                  report.detalles.map((detalle: any) => (
                    <tr key={detalle.id} className="hover:bg-gray-50 transition-colors print:break-inside-avoid">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {format(new Date(report.fecha), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-900">{detalle.medico.nombre}</div>
                        <div className="text-xs text-gray-500">{detalle.medico.telefono}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {detalle.medico.unidad.nombre}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {report.operador.nombre_completo}
                      </td>
                    </tr>
                  ))
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Search size={48} className="opacity-20" />
                        <p className="font-medium">No se encontraron turnos en el rango seleccionado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Print-only Footer */}
          <div className="hidden print:block mt-8 text-center text-[10px] text-gray-400">
            SNC SILAIS CHINADEGA - Sistema de Gestión de Médicos de Turno
          </div>
        </section>
      </main>

      {/* Helper Styles for Print */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            font-size: 10pt;
          }
          @page {
            margin: 1cm;
            size: A4 portrait;
          }
          .print\\:break-after-page {
            page-break-after: always;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          html, body {
            width: 210mm;
            height: auto;
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}
