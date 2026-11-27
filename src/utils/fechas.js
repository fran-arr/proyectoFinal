// Utilidades de fechas compartidas (calendario, inicio, etc.).
// Las fechas se manejan como texto 'YYYY-MM-DD' en hora LOCAL para evitar
// los desfases de un día que produce toISOString() (que usa UTC).

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function formatearClaveFecha(anio, mesIndex, dia) {
  const mes = String(mesIndex + 1).padStart(2, '0')
  const d = String(dia).padStart(2, '0')
  return `${anio}-${mes}-${d}`
}

export function obtenerHoyClave() {
  const ahora = new Date()
  return formatearClaveFecha(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
}

// 'YYYY-MM-DD' -> '27 nov 2026'
export function formatearFechaCorta(clave) {
  if (!clave) return '—'
  const [anio, mes, dia] = String(clave).slice(0, 10).split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// 'YYYY-MM-DD' -> 'Viernes 27 de noviembre'
export function formatearFechaLarga(clave) {
  if (!clave) return '—'
  const [anio, mes, dia] = String(clave).slice(0, 10).split('-').map(Number)
  const texto = new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Celdas de un mes con la semana empezando en lunes. null = hueco antes del día 1.
export function construirCeldasMes(anio, mesIndex) {
  const offsetInicio = (new Date(anio, mesIndex, 1).getDay() + 6) % 7
  const totalDias = new Date(anio, mesIndex + 1, 0).getDate()

  const celdas = Array(offsetInicio).fill(null)
  for (let dia = 1; dia <= totalDias; dia++) {
    celdas.push({ dia, clave: formatearClaveFecha(anio, mesIndex, dia) })
  }
  return celdas
}

// { 'YYYY-MM-DD': [evento, ...] }
export function agruparPorFecha(eventos, campo = 'fecha') {
  const mapa = {}
  for (const evento of eventos) {
    if (!evento[campo]) continue
    const clave = String(evento[campo]).slice(0, 10)
    if (!mapa[clave]) mapa[clave] = []
    mapa[clave].push(evento)
  }
  return mapa
}
