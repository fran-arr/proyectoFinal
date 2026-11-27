import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  DIAS_SEMANA,
  MESES,
  agruparPorFecha,
  construirCeldasMes,
  formatearFechaLarga,
  obtenerHoyClave,
} from '../utils/fechas'

export default function CalendarioTab({ reuniones, puedeBorrar, onRecargar, setError }) {
  const [hoyClave] = useState(obtenerHoyClave)

  const [anioActual, setAnioActual] = useState(() => Number(hoyClave.slice(0, 4)))
  const [mesActual, setMesActual] = useState(() => Number(hoyClave.slice(5, 7)) - 1)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyClave)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  // Formulario rápido para crear evento puntual en la fecha seleccionada
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('servicio_regular')
  const [lugar, setLugar] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const reunionesFiltradas = useMemo(() => {
    if (filtroCategoria === 'todas') return reuniones
    return reuniones.filter((r) => r.categoria === filtroCategoria)
  }, [reuniones, filtroCategoria])

  const eventosPorFecha = useMemo(() => agruparPorFecha(reunionesFiltradas), [reunionesFiltradas])

  const celdasCalendario = useMemo(
    () => construirCeldasMes(anioActual, mesActual),
    [anioActual, mesActual]
  )

  function irMesAnterior() {
    if (mesActual === 0) {
      setMesActual(11)
      setAnioActual((prev) => prev - 1)
    } else {
      setMesActual((prev) => prev - 1)
    }
  }

  function irMesSiguiente() {
    if (mesActual === 11) {
      setMesActual(0)
      setAnioActual((prev) => prev + 1)
    } else {
      setMesActual((prev) => prev + 1)
    }
  }

  function irAHoy() {
    setAnioActual(Number(hoyClave.slice(0, 4)))
    setMesActual(Number(hoyClave.slice(5, 7)) - 1)
    setFechaSeleccionada(hoyClave)
  }

  async function handleCrearEvento(e) {
    e.preventDefault()
    if (!titulo.trim() || !fechaSeleccionada) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('reuniones').insert([
      {
        titulo: titulo.trim(),
        categoria,
        fecha: fechaSeleccionada,
        lugar: lugar.trim() || null,
        notas: notas.trim() || null,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setTitulo('')
    setCategoria('servicio_regular')
    setLugar('')
    setNotas('')
    onRecargar()
  }

  async function handleEliminarEvento(id, tituloEvento) {
    if (!window.confirm(`¿Eliminar el evento "${tituloEvento}"?`)) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('reuniones').delete().eq('id', id)

    setGuardando(false)
    if (error) return setError(error.message)
    onRecargar()
  }

  const eventosDelDia = eventosPorFecha[fechaSeleccionada] || []

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={irMesAnterior}>
            ← Anterior
          </button>
          <h2 style={{ margin: 0, minWidth: 180, textAlign: 'center' }}>
            {MESES[mesActual]} {anioActual}
          </h2>
          <button type="button" onClick={irMesSiguiente}>
            Siguiente →
          </button>
          <button type="button" onClick={irAHoy} style={{ marginLeft: 4 }}>
            Hoy
          </button>
        </div>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="todas">Todas las categorías</option>
          <option value="servicio_regular">Servicio regular</option>
          <option value="evento_especial">Evento especial</option>
          <option value="bautismo">Bautismo</option>
        </select>
      </div>

      {/* Encabezados de días */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 6,
          marginBottom: 6,
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 13,
          color: '#4b5563',
        }}
      >
        {DIAS_SEMANA.map((dia) => (
          <div key={dia}>{dia}</div>
        ))}
      </div>

      {/* Cuadrícula mensual */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 6,
          marginBottom: 24,
        }}
      >
        {celdasCalendario.map((celda, idx) => {
          if (!celda) {
            return (
              <div
                key={`vacio-${idx}`}
                style={{
                  minHeight: 76,
                  background: '#f9fafb',
                  borderRadius: 6,
                  border: '1px solid #f3f4f6',
                }}
              />
            )
          }

          const eventosDia = eventosPorFecha[celda.clave] || []
          const esSeleccionado = celda.clave === fechaSeleccionada
          const esHoy = celda.clave === hoyClave

          return (
            <button
              key={celda.clave}
              type="button"
              onClick={() => setFechaSeleccionada(celda.clave)}
              style={{
                minHeight: 76,
                padding: 6,
                textAlign: 'left',
                verticalAlign: 'top',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 4,
                borderRadius: 6,
                cursor: 'pointer',
                background: esSeleccionado ? '#eff6ff' : '#fff',
                border: esSeleccionado
                  ? '2px solid #2563eb'
                  : esHoy
                    ? '1px solid #111827'
                    : '1px solid #e5e7eb',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: esHoy || esSeleccionado ? 'bold' : 'normal',
                  color: esHoy ? '#1d4ed8' : '#111827',
                }}
              >
                {celda.dia}
              </span>

              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                {eventosDia.slice(0, 2).map((ev) => (
                  <span
                    key={ev.id}
                    style={{
                      display: 'block',
                      fontSize: 11,
                      padding: '2px 4px',
                      borderRadius: 4,
                      background: '#dbeafe',
                      color: '#1e3a8a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ev.titulo}
                  </span>
                ))}
                {eventosDia.length > 2 && (
                  <span style={{ fontSize: 11, color: '#4b5563' }}>
                    +{eventosDia.length - 2} más
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Detalle del día seleccionado */}
      <div
        style={{
          padding: 16,
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Eventos del {formatearFechaLarga(fechaSeleccionada)} ({eventosDelDia.length})
        </h3>

        {eventosDelDia.length === 0 ? (
          <p style={{ color: '#6b7280', margin: 0 }}>
            No hay eventos puntuales registrados en esta fecha.
          </p>
        ) : (
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {eventosDelDia.map((ev) => (
              <li key={ev.id} style={{ marginBottom: 8 }}>
                <strong>{ev.titulo}</strong> [{ev.categoria}]
                {ev.lugar ? ` — Lugar: ${ev.lugar}` : ''}
                {' — '}
                <span>Asistentes: {(ev.asistencias || []).length}</span>
                {ev.notas ? ` — "${ev.notas}"` : ''}
                {puedeBorrar && (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => handleEliminarEvento(ev.id, ev.titulo)}
                    style={{ marginLeft: 8, color: 'crimson' }}
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Alta rápida en la fecha seleccionada */}
      <div
        style={{
          padding: 16,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Nuevo evento el {formatearFechaLarga(fechaSeleccionada)}</h3>
        <form onSubmit={handleCrearEvento} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Título del evento *"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="servicio_regular">Servicio regular</option>
            <option value="evento_especial">Evento especial</option>
            <option value="bautismo">Bautismo</option>
          </select>
          <input
            type="text"
            placeholder="Lugar (ej. Auditorio)"
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
          />
          <input
            type="text"
            placeholder="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Agregar al calendario'}
          </button>
        </form>
      </div>
    </section>
  )
}