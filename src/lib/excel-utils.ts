import * as XLSX from 'xlsx'

export function generateMedicoTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      'Nombre Completo': 'Dr. Ejemplo Pérez',
      'Teléfono': '8888-8888',
      'Municipio / Unidad': 'Hospital Central',
      'Tipo (GENERAL/SOCIAL)': 'GENERAL'
    }
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Medicos')
  
  // Create spreadsheet and binary string
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return data
}

export async function parseMedicoExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // Map to our database fields
        const mappedData = jsonData.map((row: any) => ({
          nombre: row['Nombre Completo'] || row['Nombre'] || row['nombre'],
          telefono: String(row['Teléfono'] || row['Telefono'] || row['telefono'] || ''),
          municipio_unidad: row['Municipio / Unidad'] || row['Unidad'] || row['municipio_unidad'],
          tipo: String(row['Tipo (GENERAL/SOCIAL)'] || row['Tipo'] || row['tipo'] || 'GENERAL').toUpperCase().trim()
        }))

        // Filter out empty rows
        const validData = mappedData.filter(m => m.nombre && m.municipio_unidad)
        resolve(validData)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export function exportToExcel(data: any[], fileName: string, header: string) {
  // Create worksheet from data with header rows shifted down
  const ws = XLSX.utils.aoa_to_sheet([[]])
  XLSX.utils.sheet_add_json(ws, data, { origin: 'A4' })

  // Add the title header
  XLSX.utils.sheet_add_aoa(ws, [
    [header],
    [`FECHA DE GENERACIÓN: ${new Date().toLocaleDateString('es-NI')}`]
  ], { origin: 'A1' })

  // Styling (simple range merge for title)
  if (!ws['!merges']) ws['!merges'] = []
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }) // Title row
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }) // Date row

  // Adjust column widths
  ws['!cols'] = [
    { wch: 15 }, // Fecha
    { wch: 30 }, // Medico
    { wch: 15 }, // Telefono
    { wch: 25 }, // Unidad
    { wch: 25 }, // Operador
    { wch: 15 }  // Hora
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Turnos')
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}
