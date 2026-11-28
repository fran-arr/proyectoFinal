import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Icon from '../../components/Icon/Icon'
import styles from './Perfil.module.css'

const LARGO_MINIMO_CLAVE = 8

function formatearFechaHora(isoTexto) {
  if (!isoTexto) return '—'
  return new Date(isoTexto).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}

function obtenerIniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function datosIniciales(persona) {
  return {
    nombres: persona?.nombres || '',
    apellidos: persona?.apellidos || '',
    telefono: persona?.telefono || '',
    email: persona?.email || '',
  }
}

export default function Perfil({ perfilUsuario, usuarioAuth, onRecargar }) {
  const persona = perfilUsuario?.personas
  const rol = perfilUsuario?.roles
  const nombre = persona ? `${persona.nombres} ${persona.apellidos}` : usuarioAuth.email

  // ----- Datos personales -----
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(() => datosIniciales(persona))
  const [guardando, setGuardando] = useState(false)
  const [mensajeDatos, setMensajeDatos] = useState(null)

  // ----- Contraseña -----
  const [clave, setClave] = useState('')
  const [claveRepetida, setClaveRepetida] = useState('')
  const [guardandoClave, setGuardandoClave] = useState(false)
  const [mensajeClave, setMensajeClave] = useState(null)

  function cambiarCampo(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function empezarEdicion() {
    setForm(datosIniciales(persona))
    setMensajeDatos(null)
    setEditando(true)
  }

  async function guardarDatos(e) {
    e.preventDefault()
    if (!form.nombres.trim() || !form.apellidos.trim()) {
      return setMensajeDatos({ tipo: 'error', texto: 'Nombres y apellidos son obligatorios.' })
    }

    setGuardando(true)
    setMensajeDatos(null)

    const { error } = await supabase
      .from('personas')
      .update({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
      })
      .eq('id', persona.id)

    setGuardando(false)
    if (error) return setMensajeDatos({ tipo: 'error', texto: error.message })

    setEditando(false)
    setMensajeDatos({ tipo: 'ok', texto: 'Datos actualizados correctamente.' })
    onRecargar()
  }

  async function cambiarClave(e) {
    e.preventDefault()
    setMensajeClave(null)

    if (clave.length < LARGO_MINIMO_CLAVE) {
      return setMensajeClave({
        tipo: 'error',
        texto: `La contraseña debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`,
      })
    }
    if (clave !== claveRepetida) {
      return setMensajeClave({ tipo: 'error', texto: 'Las contraseñas no coinciden.' })
    }

    setGuardandoClave(true)
    const { error } = await supabase.auth.updateUser({ password: clave })
    setGuardandoClave(false)

    if (error) return setMensajeClave({ tipo: 'error', texto: error.message })

    setClave('')
    setClaveRepetida('')
    setMensajeClave({ tipo: 'ok', texto: 'Contraseña actualizada.' })
  }

  return (
    <div className={styles.pagina}>
      {/* Cabecera */}
      <section className={styles.cabecera}>
        <span className={styles.avatar} aria-hidden="true">
          {obtenerIniciales(nombre) || '?'}
        </span>
        <div className={styles.cabeceraTexto}>
          <h2 className={styles.nombre}>{nombre}</h2>
          <p className={styles.correo}>{usuarioAuth.email}</p>
          <div className={styles.etiquetas}>
            {rol && <span className={styles.rol}>{rol.nombre}</span>}
            <span className={perfilUsuario?.activo ? styles.activo : styles.inactivo}>
              {perfilUsuario ? (perfilUsuario.activo ? 'Activo' : 'Suspendido') : 'Sin perfil'}
            </span>
          </div>
        </div>
      </section>

      <div className={styles.columnas}>
        {/* Datos personales */}
        <section className={styles.tarjeta}>
          <div className={styles.cabeceraTarjeta}>
            <h3 className={styles.tituloTarjeta}>
              <Icon name="user" size={18} /> Datos personales
            </h3>
            {persona && !editando && (
              <button type="button" className={styles.botonSecundario} onClick={empezarEdicion}>
                <Icon name="edit" size={16} /> Editar
              </button>
            )}
          </div>

          {!persona ? (
            <p className={styles.aviso}>
              Tu cuenta no está vinculada a una persona. Pide al administrador que la vincule desde
              “Usuarios y Roles” para poder editar tus datos.
            </p>
          ) : editando ? (
            <form className={styles.formulario} onSubmit={guardarDatos}>
              <div className={styles.fila}>
                <label className={styles.campo}>
                  <span>Nombres *</span>
                  <input name="nombres" value={form.nombres} onChange={cambiarCampo} required />
                </label>
                <label className={styles.campo}>
                  <span>Apellidos *</span>
                  <input name="apellidos" value={form.apellidos} onChange={cambiarCampo} required />
                </label>
              </div>
              <div className={styles.fila}>
                <label className={styles.campo}>
                  <span>Teléfono</span>
                  <input
                    name="telefono"
                    type="tel"
                    value={form.telefono}
                    onChange={cambiarCampo}
                    placeholder="+56 9 1234 5678"
                  />
                </label>
                <label className={styles.campo}>
                  <span>Correo de contacto</span>
                  <input name="email" type="email" value={form.email} onChange={cambiarCampo} />
                </label>
              </div>

              <div className={styles.acciones}>
                <button
                  type="button"
                  className={styles.botonSecundario}
                  onClick={() => setEditando(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.botonPrimario} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          ) : (
            <dl className={styles.datos}>
              <div>
                <dt>Nombres</dt>
                <dd>{persona.nombres || '—'}</dd>
              </div>
              <div>
                <dt>Apellidos</dt>
                <dd>{persona.apellidos || '—'}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{persona.telefono || '—'}</dd>
              </div>
              <div>
                <dt>Correo de contacto</dt>
                <dd>{persona.email || '—'}</dd>
              </div>
            </dl>
          )}

          {mensajeDatos && (
            <p
              className={mensajeDatos.tipo === 'ok' ? styles.mensajeOk : styles.mensajeError}
              role={mensajeDatos.tipo === 'ok' ? 'status' : 'alert'}
            >
              {mensajeDatos.texto}
            </p>
          )}
        </section>

        {/* Cuenta */}
        <section className={styles.tarjeta}>
          <div className={styles.cabeceraTarjeta}>
            <h3 className={styles.tituloTarjeta}>
              <Icon name="shield" size={18} /> Cuenta
            </h3>
          </div>
          <dl className={styles.datos}>
            <div>
              <dt>Correo de acceso</dt>
              <dd>{usuarioAuth.email}</dd>
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
              <dt>Último acceso</dt>
              <dd>{formatearFechaHora(usuarioAuth.last_sign_in_at)}</dd>
            </div>
            <div>
              <dt>Cuenta creada</dt>
              <dd>{formatearFechaHora(usuarioAuth.created_at)}</dd>
            </div>
          </dl>
          <p className={styles.nota}>
            El usuario y el rol solo los puede cambiar un administrador.
          </p>
        </section>

        {/* Seguridad */}
        <section className={styles.tarjeta}>
          <div className={styles.cabeceraTarjeta}>
            <h3 className={styles.tituloTarjeta}>
              <Icon name="lock" size={18} /> Cambiar contraseña
            </h3>
          </div>
          <form className={styles.formulario} onSubmit={cambiarClave}>
            <label className={styles.campo}>
              <span>Nueva contraseña</span>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete="new-password"
                minLength={LARGO_MINIMO_CLAVE}
                required
              />
            </label>
            <label className={styles.campo}>
              <span>Repetir contraseña</span>
              <input
                type="password"
                value={claveRepetida}
                onChange={(e) => setClaveRepetida(e.target.value)}
                autoComplete="new-password"
                minLength={LARGO_MINIMO_CLAVE}
                required
              />
            </label>
            <div className={styles.acciones}>
              <button type="submit" className={styles.botonPrimario} disabled={guardandoClave}>
                {guardandoClave ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>

          {mensajeClave && (
            <p
              className={mensajeClave.tipo === 'ok' ? styles.mensajeOk : styles.mensajeError}
              role={mensajeClave.tipo === 'ok' ? 'status' : 'alert'}
            >
              {mensajeClave.texto}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
