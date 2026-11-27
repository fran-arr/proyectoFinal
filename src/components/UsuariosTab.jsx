import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function UsuariosTab({ personas, roles, usuariosSistema, onRecargar, setError }) {
  const [cuentasAuth, setCuentasAuth] = useState([])
  const [authUserId, setAuthUserId] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [rolId, setRolId] = useState('')
  const [username, setUsername] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargarCuentasAuth() {
    const { data, error } = await supabase.rpc('listar_cuentas_auth')
    if (error) {
      setError(`No se pudieron cargar cuentas Auth: ${error.message}`)
      return
    }
    setCuentasAuth(data || [])
  }

  useEffect(() => {
    cargarCuentasAuth()
  }, [])

  // Filtrar cuentas de Auth que todavía no tienen fila en usuarios_sistema
  const idsVinculados = new Set(usuariosSistema.map((u) => u.auth_user_id).filter(Boolean))
  const cuentasDisponibles = cuentasAuth.filter((c) => !idsVinculados.has(c.id))

  async function handleVincularUsuario(e) {
    e.preventDefault()
    if (!authUserId || !personaId || !rolId) return

    setGuardando(true)
    setError(null)

    const cuentaElegida = cuentasAuth.find((c) => c.id === authUserId)
    const usernameFinal =
      username.trim() || (cuentaElegida?.email ? cuentaElegida.email.split('@')[0] : `user_${Date.now()}`)

    const { error } = await supabase.from('usuarios_sistema').insert([
      {
        auth_user_id: authUserId,
        persona_id: Number(personaId),
        rol_id: Number(rolId),
        username: usernameFinal,
        activo: true,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setAuthUserId('')
    setPersonaId('')
    setRolId('')
    setUsername('')
    onRecargar()
  }

  async function handleCambiarRol(usuarioId, nuevoRolId) {
    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('usuarios_sistema')
      .update({ rol_id: Number(nuevoRolId) })
      .eq('id', usuarioId)

    setGuardando(false)
    if (error) return setError(error.message)
    onRecargar()
  }

  async function handleToggleActivo(usuarioId, estadoActual) {
    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('usuarios_sistema')
      .update({ activo: !estadoActual })
      .eq('id', usuarioId)

    setGuardando(false)
    if (error) return setError(error.message)
    onRecargar()
  }

  return (
    <section>
      <h2>Vincular cuenta de acceso a persona y rol</h2>
      <p style={{ color: '#555', fontSize: 14 }}>
        Primero crea el correo y contraseña en <strong>Supabase → Authentication → Users</strong> (con Auto Confirm), y luego vincúlalo aquí.
      </p>

      <form onSubmit={handleVincularUsuario} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={authUserId} onChange={(e) => setAuthUserId(e.target.value)} required>
          <option value="">-- Cuenta de correo (Auth) * --</option>
          {cuentasDisponibles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.email}
            </option>
          ))}
        </select>

        <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} required>
          <option value="">-- Persona asociada * --</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos} ({p.etapa})
            </option>
          ))}
        </select>

        <select value={rolId} onChange={(e) => setRolId(e.target.value)} required>
          <option value="">-- Rol del sistema * --</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Alias / username (opcional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Vincular usuario'}
        </button>
      </form>

      <h3>Usuarios del sistema ({usuariosSistema.length})</h3>
      <ul style={{ paddingLeft: 18 }}>
        {usuariosSistema.map((u) => {
          const cuenta = cuentasAuth.find((c) => c.id === u.auth_user_id)
          return (
            <li key={u.id} style={{ marginBottom: 10 }}>
              <strong>
                {u.personas ? `${u.personas.nombres} ${u.personas.apellidos}` : u.username}
              </strong>{' '}
              ({cuenta?.email || u.username}) — Estado:{' '}
              <strong style={{ color: u.activo ? 'green' : 'crimson' }}>
                {u.activo ? 'Activo' : 'Suspendido'}
              </strong>{' '}
              <select
                value={u.rol_id}
                disabled={guardando}
                onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                style={{ marginLeft: 8 }}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>{' '}
              <button
                type="button"
                disabled={guardando}
                onClick={() => handleToggleActivo(u.id, u.activo)}
                style={{ marginLeft: 6 }}
              >
                {u.activo ? 'Suspender' : 'Reactivar'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}