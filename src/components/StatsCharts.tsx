'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

interface Props {
  data: {
    unit: string
    count: number
  }[]
}

const COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
  '#facc15', '#f472b6', '#a855f7', '#0ea5e9', '#d946ef',
  '#84cc16', '#475569', '#94a3b8', '#dc2626', '#d97706'
]

export default function StatsCharts({ data }: Props) {
  if (data.length === 0) return (
    <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
      No hay suficientes datos para generar gráficos
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Bar Chart */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold text-gray-800">Productividad por Municipio / Unidad</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="unit" 
                type="category" 
                width={120} 
                fontSize={12} 
                tick={{ fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold text-gray-800">Distribución Porcentual</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
                nameKey="unit"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
