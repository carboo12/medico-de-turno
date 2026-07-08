import { getMedicos, getReports, getUnidades } from '@/app/actions'
import ReportForm from '@/components/ReportForm'
import ReportHistory from '@/components/ReportHistory'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Stethoscope } from 'lucide-react'
import { logout } from '@/app/auth-actions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [medicos, reports, unidades] = await Promise.all([
    getMedicos(),
    getReports(),
    getUnidades()
  ])

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">SNC Medic</h1>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Control de Turnos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="mr-4 hidden items-center gap-1 sm:flex">
              <Link 
                href="/dashboard/medicos" 
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                Personal
              </Link>
              <Link 
                href="/dashboard/unidades" 
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                Unidades
              </Link>
              <Link 
                href="/dashboard/logs" 
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                Logs
              </Link>
              <Link 
                href="/dashboard/reporte-medicos" 
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
              >
                Personal
              </Link>
              <Link 
                href="/dashboard/reporte-duplicados" 
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                Duplicados
              </Link>

              <Link 
                href="/dashboard/reportes" 
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors"
              >
                Reportes
              </Link>
            </nav>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
              <p className="text-xs text-gray-500">Operador Activo</p>
            </div>
            <form action={logout}>
              <button 
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-100"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column - Form */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <ReportForm medicos={medicos} unidades={unidades} />
            </div>
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-7">
            <ReportHistory reports={reports} medicos={medicos} unidades={unidades} />
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-gray-400">© 2024 SNC Medic - Sistema de Gestión Local Premium</p>
        </div>
      </footer>
    </div>
  )
}
