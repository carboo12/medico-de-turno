import { getLogs } from '@/app/actions'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, LogOut, Stethoscope, Clock, Activity } from 'lucide-react'
import { logout } from '@/app/auth-actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function LogsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const logs = await getLogs()

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Stethoscope size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">SNC Medic</h1>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Log de Acciones</p>
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
            <div className="h-6 w-px bg-gray-200"></div>
            <form action={logout}>
              <button 
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <LogOut size={20} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Historial de Actividad</h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha y Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                        No hay registros de actividad.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            {format(new Date(log.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{log.usuario}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            log.accion.includes('ELIMINAR') ? 'bg-red-100 text-red-700' : 
                            log.accion.includes('CREAR') ? 'bg-green-100 text-green-700' : 
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {log.accion}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.descripcion}>
                          {log.descripcion}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
