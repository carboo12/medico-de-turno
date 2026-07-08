import { getMedicos, getUnidades } from '@/app/actions'
import MedicoManager from '@/components/MedicoManager'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, LogOut, Stethoscope } from 'lucide-react'
import { logout } from '@/app/auth-actions'

export default async function MedicosPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [medicos, unidades] = await Promise.all([
    getMedicos(),
    getUnidades()
  ])

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
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gestión de Personal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={18} />
              Volver al Dashboard
            </Link>
            <Link 
              href="/dashboard/unidades"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            >
              Unidades
            </Link>
            <Link 
              href="/dashboard/reporte-medicos"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            >
              Reporte Personal
            </Link>
            <Link 
              href="/dashboard/reporte-duplicados"
              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Duplicados
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
        <MedicoManager initialMedicos={medicos as any} unidades={unidades} />
      </main>
    </div>
  )
}
