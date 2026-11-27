import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon/Icon'
import MiniCalendario from '../../components/MiniCalendario/MiniCalendario'
import { obtenerHoyClave } from '../../utils/fechas'
import styles from './Inicio.module.css'

// Las fechas de Supabase llegan como 'YYYY-MM-DD'. Se separan a mano para evitar
// que new Date() las interprete en UTC y muestre el día anterior.
function formatearFecha(fechaTexto) {
  if (!fechaTexto) return '—'
  const [anio, mes, dia] = fechaTexto.slice(0, 10).split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatearFechaHora(isoTexto) {
  if (!isoTexto) return '—'
  return new Date(isoTexto).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}

// 'servicio_regular' -> 'Servicio regular'
function texto(valor) {
  if (!valor) return '—'
  const limpio = String(valor).replaceAll('_', ' ')
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

export default function Inicio({
  perfilUsuario,
  emailSesion,
  ultimoAcceso,
  modulos,
  personas,
  seguimientos,
  grupos,
  familias,
  reuniones,
}) {
  const persona = perfilUsuario?.personas
  const nombre = persona ? `${persona.nombres} ${persona.apellidos}` : emailSesion
  const primerNombre = persona?.nombres?.split(' ')[0] || ''
  const rol = perfilUsuario?.roles
  const [hoy] = useState(() =>
    texto(
      new Date().toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    )
  )

  const contarEtapa = (etapa) => personas.filter((p) => p.etapa === etapa).length
  const indicadores = [
    { label: 'Personas', valor: personas.length, ruta: '/personas', icono: 'users' },
    { label: 'Visitas', valor: contarEtapa('visita'), ruta: '/personas', icono: 'users' },
    { label: 'En seguimiento', valor: contarEtapa('en_seguimiento'), ruta: '/seguimientos', icono: 'message' },
    { label: 'Miembros', valor: contarEtapa('miembro'), ruta: '/personas', icono: 'users' },
    { label: 'Grupos activos', valor: grupos.filter((g) => g.activo !== false).length, ruta: '/grupos', icono: 'layers' },
    { label: 'Familias', valor: familias.length, ruta: '/familias', icono: 'heart' },
    { label: 'Reuniones', valor: reuniones.length, ruta: '/reuniones', icono: 'clipboard' },
  ]

  const ultimasReuniones = reuniones.slice(0, 4)
  const [hoyClave] = useState(obtenerHoyClave)
  const proximosEventos = reuniones
    .filter((r) => r.fecha && String(r.fecha).slice(0, 10) >= hoyClave)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .slice(0, 5)
  const ultimosSeguimientos = seguimientos.slice(0, 4)

  return (
    <div className={styles.panel}>
      {/* Bienvenida */}
      <section className={styles.bienvenida}>
        <div>
          <p className={styles.fecha}>{hoy}</p>
          <h2 className={styles.saludo}>Hola{primerNombre ? `, ${primerNombre}` : ''} 👋</h2>
          <p className={styles.subtexto}>Este es el resumen general de la iglesia.</p>
        </div>
      </section>

      {!perfilUsuario && (
        <p className={styles.aviso}>
          Tu cuenta aún no está vinculada a una persona ni a un rol. Pide al administrador que la
          vincule en <strong>Usuarios y Roles</strong>.
        </p>
      )}

      <div className={styles.columnas}>
        {/* Perfil del usuario */}
        <section className={`${styles.tarjeta} ${styles.perfil}`}>
          <h3 className={styles.tituloTarjeta}>Mi perfil</h3>
          <div className={styles.perfilCabecera}>
            <span className={styles.avatarGrande} aria-hidden="true">
              {nombre
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0].toUpperCase())
                .join('')}
            </span>
            <div>
              <strong className={styles.perfilNombre}>{nombre}</strong>
              {rol && <span className={styles.rolBadge}>{rol.nombre}</span>}
            </div>
          </div>

          <dl className={styles.datos}>
            <div>
              <dt>Correo</dt>
              <dd>{persona?.email || emailSesion}</dd>
            </div>
            <div>
              <dt>Usuario</dt>
              <dd>{perfilUsuario?.username || '—'}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{rol ? rol.descripcion || rol.nombre : 'Sin rol asignado'}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <span className={perfilUsuario?.activo ? styles.estadoActivo : styles.estadoInactivo}>
                  {perfilUsuario ? (perfilUsuario.activo ? 'Activo' : 'Suspendido') : 'Sin perfil'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Último acceso</dt>
              <dd>{formatearFechaHora(ultimoAcceso)}</dd>
            </div>
          </dl>
        </section>

        {/* Indicadores */}
        <section className={styles.indicadores} aria-label="Indicadores generales">
          {indicadores.map((ind) => (
            <Link key={ind.label} to={ind.ruta} className={styles.indicador}>
              <span className={styles.indicadorIcono}>
                <Icon name={ind.icono} size={18} />
              </span>
              <span className={styles.indicadorValor}>{ind.valor}</span>
              <span className={styles.indicadorLabel}>{ind.label}</span>
            </Link>
          ))}
        </section>
      </div>

      <div className={styles.columnas2}>
        <MiniCalendario reuniones={reuniones} />

        {/* Próximos eventos */}
        <section className={styles.tarjeta}>
          <div className={styles.cabeceraTarjeta}>
            <h3 className={styles.tituloTarjeta}>Próximos eventos</h3>
            <Link to="/calendario" className={styles.verTodo}>
              Ver calendario <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          {proximosEventos.length === 0 ? (
            <p className={styles.vacio}>No hay eventos programados desde hoy.</p>
          ) : (
            <ul className={styles.lista}>
              {proximosEventos.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.titulo}</strong>
                    <span>
                      {texto(r.categoria)}
                      {r.lugar ? ` · ${r.lugar}` : ''}
                    </span>
                  </div>
                  <span className={styles.contador}>
                    {String(r.fecha).slice(0, 10) === hoyClave ? 'Hoy' : formatearFecha(r.fecha)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className={styles.columnas2}>
        {/* Últimas reuniones */}
        <section className={styles.tarjeta}>
          <div className={styles.cabeceraTarjeta}>
            <h3 className={styles.tituloTarjeta}>Últimas reuniones</h3>
            <Link to="/reuniones" className={styles.verTodo}>
              Ver todas <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          {ultimasReuniones.length === 0 ? (
            <p className={styles.vacio}>Aún no hay reuniones registradas.</p>
          ) : (
            <ul className={styles.lista}>
              {ultimasReuniones.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.titulo}</strong>
                    <span>
                      {formatearFecha(r.fecha)} · {texto(r.categoria)}
                    </span>
                  </div>
                  <span className={styles.contador}>{(r.asistencias || []).length}{' '}
                    {(r.asistencias || []).length === 1 ? 'asistente' : 'asistentes'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Seguimientos recientes */}
        <section className={styles.tarjeta}>
          <div className={styles.cabeceraTarjeta}>
            <h3 className={styles.tituloTarjeta}>Seguimientos recientes</h3>
            <Link to="/seguimientos" className={styles.verTodo}>
              Ver todos <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          {ultimosSeguimientos.length === 0 ? (
            <p className={styles.vacio}>Aún no hay seguimientos registrados.</p>
          ) : (
            <ul className={styles.lista}>
              {ultimosSeguimientos.map((s) => (
                <li key={s.id}>
                  <div>
                    <strong>
                      {s.persona ? `${s.persona.nombres} ${s.persona.apellidos}` : 'Persona'}
                    </strong>
                    <span>
                      {formatearFecha(s.fecha_contacto)} · {texto(s.tipo)}
                    </span>
                  </div>
                  <span className={styles.contador}>{texto(s.resultado)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Accesos directos */}
      <section>
        <h3 className={styles.tituloSeccion}>Accesos directos</h3>
        <div className={styles.accesos}>
          {modulos.map((m) => (
            <Link key={m.id} to={m.ruta} className={styles.acceso}>
              <span className={styles.indicadorIcono}>
                <Icon name={m.icono} size={18} />
              </span>
              <div>
                <strong>{m.label}</strong>
                <span>{m.descripcion}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
