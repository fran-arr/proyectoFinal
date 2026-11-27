import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon'
import {
  DIAS_SEMANA,
  MESES,
  agruparPorFecha,
  construirCeldasMes,
  formatearFechaLarga,
  obtenerHoyClave,
} from '../../utils/fechas'
import styles from './MiniCalendario.module.css'

const textoCategoria = (c) => {
  if (!c) return ''
  const limpio = c.replaceAll('_', ' ')
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

export default function MiniCalendario({ reuniones }) {
  const [hoyClave] = useState(obtenerHoyClave)
  const [anio, setAnio] = useState(() => Number(hoyClave.slice(0, 4)))
  const [mes, setMes] = useState(() => Number(hoyClave.slice(5, 7)) - 1)
  const [seleccion, setSeleccion] = useState(hoyClave)

  const eventosPorFecha = useMemo(() => agruparPorFecha(reuniones), [reuniones])
  const celdas = useMemo(() => construirCeldasMes(anio, mes), [anio, mes])
  const eventosDelDia = eventosPorFecha[seleccion] || []

  function cambiarMes(delta) {
    const fecha = new Date(anio, mes + delta, 1)
    setAnio(fecha.getFullYear())
    setMes(fecha.getMonth())
  }

  return (
    <section className={styles.tarjeta}>
      <div className={styles.cabecera}>
        <h3 className={styles.titulo}>Calendario</h3>
        <Link to="/calendario" className={styles.abrir}>
          Abrir calendario <Icon name="arrowRight" size={14} />
        </Link>
      </div>

      <div className={styles.navegacion}>
        <button
          type="button"
          className={styles.flecha}
          onClick={() => cambiarMes(-1)}
          aria-label="Mes anterior"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <strong>
          {MESES[mes]} {anio}
        </strong>
        <button
          type="button"
          className={styles.flecha}
          onClick={() => cambiarMes(1)}
          aria-label="Mes siguiente"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>

      <div className={styles.grilla} role="grid">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className={styles.diaSemana}>
            {d.charAt(0)}
          </span>
        ))}

        {celdas.map((celda, i) => {
          if (!celda) return <span key={`vacio-${i}`} />

          const cantidad = (eventosPorFecha[celda.clave] || []).length
          const clases = [
            styles.dia,
            celda.clave === hoyClave && styles.hoy,
            celda.clave === seleccion && styles.seleccionado,
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={celda.clave}
              type="button"
              className={clases}
              onClick={() => setSeleccion(celda.clave)}
              aria-label={`${celda.dia} de ${MESES[mes]}${cantidad ? `, ${cantidad} evento(s)` : ''}`}
              aria-pressed={celda.clave === seleccion}
            >
              {celda.dia}
              {cantidad > 0 && <span className={styles.punto} aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <div className={styles.detalle}>
        <p className={styles.detalleFecha}>{formatearFechaLarga(seleccion)}</p>
        {eventosDelDia.length === 0 ? (
          <p className={styles.vacio}>Sin eventos este día.</p>
        ) : (
          <ul className={styles.eventos}>
            {eventosDelDia.map((ev) => (
              <li key={ev.id}>
                <strong>{ev.titulo}</strong>
                <span>
                  {textoCategoria(ev.categoria)}
                  {ev.lugar ? ` · ${ev.lugar}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
