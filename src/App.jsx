import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginForm from './components/LoginForm'
import PersonasTab from './components/PersonasTab'
import SeguimientosTab from './components/SeguimientosTab'
import GruposTab from './components/GruposTab'
import FamiliasTab from './components/FamiliasTab'
import ReunionesTab from './components/ReunionesTab'
import UsuariosTab from './components/UsuariosTab'

const PESTAÑAS_BASE = [
  { id: 'personas', label: 'Personas' },
  { id: 'seguimientos', label: 'Seguimientos' },
  { id: 'grupos', label: 'Grupos' },
  { id: 'familias', label: 'Familias' },
  { id: 'reuniones', label: 'Reuniones' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [perfilUsuario, setPerfilUsuario] = useState(null)
  const [cargandoAuth, setCargandoAuth] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState('personas')

  const [personas, setPersonas] = useState([])
  const [familias, setFamilias] = useState([])
  const [seguimientos, setSeguimientos] = useState([])
  const [grupos, setGrupos] = useState([])
  const [reuniones, setReuniones] = useState([])
  const [roles, setRoles] = useState([])
  const [usuariosSistema, setUsuariosSistema] = useState([])
  const [error, setError] = useState(null)

  async function cargarPerfilYDatos(userId) {
    setError(null)

    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios_sistema')
      .select(`
        id,
        username,
        activo,
        personas ( id, nombres, apellidos, email ),
        roles ( id, nombre, descripcion )
      `)
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (usuarioError) {
      setError(`Error consultando perfil: ${usuarioError.message}`)
      return
    }

    if (usuarioData && usuarioData.activo === false) {
      setError('Tu cuenta está suspendida. Contacta al administrador.')
      await supabase.auth.signOut()
      return
    }

    setPerfilUsuario(usuarioData || null)
    const esAdmin = usuarioData?.roles?.nombre === 'admin'

    const consultas = [
      supabase.from('personas').select('*').order('id', { ascending: false }),
      supabase
        .from('familias')
        .select(`
          id,
          nombre_familia,
          telefono_hogar,
          persona_familia (
            parentesco,
            personas ( id, nombres, apellidos, etapa )
          )
        `)
        .order('id', { ascending: false }),
      supabase
        .from('seguimientos')
        .select(`
          id,
          fecha_contacto,
          tipo,
          resultado,
          notas,
          persona:personas!seguimientos_persona_id_fkey ( id, nombres, apellidos, etapa ),
          lider:personas!seguimientos_lider_id_fkey ( id, nombres, apellidos )
        `)
        .order('fecha_contacto', { ascending: false })
        .order('id', { ascending: false }),
      supabase
        .from('grupos')
        .select(`
          id,
          nombre,
          tipo,
          dia_horario,
          activo,
          grupo_padre:grupos!grupo_padre_id ( id, nombre, tipo ),
          grupo_miembros (
            rol_en_grupo,
            fecha_ingreso,
            personas ( id, nombres, apellidos, etapa )
          )
        `)
        .order('id', { ascending: false }),
      supabase
        .from('reuniones')
        .select(`
          id,
          titulo,
          categoria,
          fecha,
          lugar,
          asistencias (
            hora_registro,
            personas ( id, nombres, apellidos, etapa )
          )
        `)
        .order('fecha', { ascending: false })
        .order('id', { ascending: false }),
    ]

    if (esAdmin) {
      consultas.push(
        supabase.from('roles').select('*').order('id', { ascending: true }),
        supabase
          .from('usuarios_sistema')
          .select(`
            id,
            username,
            activo,
            rol_id,
            auth_user_id,
            personas ( id, nombres, apellidos ),
            roles ( id, nombre )
          `)
          .order('id', { ascending: true })
      )
    }

    const resultados = await Promise.all(consultas)
    const [personasRes, familiasRes, seguimientosRes, gruposRes, reunionesRes, rolesRes, usuariosRes] = resultados

    if (personasRes.error) return setError(personasRes.error.message)
    if (familiasRes.error) return setError(familiasRes.error.message)
    if (seguimientosRes.error) return setError(seguimientosRes.error.message)
    if (gruposRes.error) return setError(gruposRes.error.message)
    if (reunionesRes.error) return setError(reunionesRes.error.message)

    setPersonas(personasRes.data || [])
    setFamilias(familiasRes.data || [])
    setSeguimientos(seguimientosRes.data || [])
    setGrupos(gruposRes.data || [])
    setReuniones(reunionesRes.data || [])

    if (esAdmin) {
      if (rolesRes?.error) return setError(rolesRes.error.message)
      if (usuariosRes?.error) return setError(usuariosRes.error.message)
      setRoles(rolesRes?.data || [])
      setUsuariosSistema(usuariosRes?.data || [])
    } else {
      setRoles([])
      setUsuariosSistema([])
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentSession = data.session ?? null
      setSession(currentSession)
      if (currentSession?.user?.id) cargarPerfilYDatos(currentSession.user.id)
      setCargandoAuth(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user?.id) {
        cargarPerfilYDatos(newSession.user.id)
      } else {
        setPerfilUsuario(null)
        setPersonas([])
        setFamilias([])
        setSeguimientos([])
        setGrupos([])
        setReuniones([])
        setRoles([])
        setUsuariosSistema([])
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  if (cargandoAuth) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Cargando sesión...</div>
  }

  if (!session) {
    return <LoginForm error={error} setError={setError} />
  }

  const recargar = () => session?.user?.id && cargarPerfilYDatos(session.user.id)

  // AQUÍ ESTÁ LA PARTE 5: Calculamos permisos según el rol
  const rolActual = perfilUsuario?.roles?.nombre
  const esAdmin = rolActual === 'admin'
  const puedeBorrar = rolActual === 'admin' || rolActual === 'pastor'

  const pestañasVisibles = esAdmin
    ? [...PESTAÑAS_BASE, { id: 'usuarios', label: 'Usuarios y Roles' }]
    : PESTAÑAS_BASE

  const totalVisitas = personas.filter((p) => p.etapa === 'visita').length
  const totalEnSeguimiento = personas.filter((p) => p.etapa === 'en_seguimiento').length
  const totalMiembros = personas.filter((p) => p.etapa === 'miembro').length

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Gestión de Iglesia</h1>
          <p style={{ margin: '4px 0 0 0', color: '#555' }}>
            Usuario:{' '}
            <strong>
              {perfilUsuario?.personas
                ? `${perfilUsuario.personas.nombres} ${perfilUsuario.personas.apellidos}`
                : session.user.email}
            </strong>{' '}
            — Rol: <strong>{rolActual || 'sin perfil'}</strong>
          </p>
        </div>
        <button type="button" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </header>

      {/* Indicadores rápidos */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 20,
          padding: 12,
          background: '#f5f7fa',
          borderRadius: 8,
        }}
      >
        <span><strong>Visitas:</strong> {totalVisitas}</span>
        <span>|</span>
        <span><strong>En seguimiento:</strong> {totalEnSeguimiento}</span>
        <span>|</span>
        <span><strong>Miembros:</strong> {totalMiembros}</span>
        <span>|</span>
        <span><strong>Grupos:</strong> {grupos.length}</span>
        <span>|</span>
        <span><strong>Reuniones:</strong> {reuniones.length}</span>
      </div>

      {/* Barra de pestañas */}
      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {pestañasVisibles.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPestañaActiva(tab.id)}
            style={{
              padding: '8px 14px',
              fontWeight: pestañaActiva === tab.id ? 'bold' : 'normal',
              background: pestañaActiva === tab.id ? '#1f2937' : '#e5e7eb',
              color: pestañaActiva === tab.id ? '#fff' : '#111',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && (
        <p style={{ color: 'crimson', background: '#ffeef0', padding: 10, borderRadius: 6 }}>
          Error: {error}
        </p>
      )}

      {/* AQUÍ PASAMOS "puedeBorrar" A LAS PESTAÑAS QUE TIENEN BOTÓN ELIMINAR */}
      {pestañaActiva === 'personas' && (
        <PersonasTab
          personas={personas}
          puedeBorrar={puedeBorrar}
          onRecargar={recargar}
          setError={setError}
        />
      )}
      {pestañaActiva === 'seguimientos' && (
        <SeguimientosTab
         personas={personas}
    seguimientos={seguimientos}
    puedeBorrar={puedeBorrar}
    onRecargar={recargar}
    setError={setError}
        />
      )}
      {pestañaActiva === 'grupos' && (
        <GruposTab
          personas={personas}
          grupos={grupos}
          puedeBorrar={puedeBorrar}
          onRecargar={recargar}
          setError={setError}
        />
      )}
      {pestañaActiva === 'familias' && (
        <FamiliasTab
         personas={personas}
    familias={familias}
    puedeBorrar={puedeBorrar}
    onRecargar={recargar}
    setError={setError}
        />
      )}
      {pestañaActiva === 'reuniones' && (
        <ReunionesTab
          personas={personas}
          reuniones={reuniones}
          puedeBorrar={puedeBorrar}
          onRecargar={recargar}
          setError={setError}
        />
      )}
      {pestañaActiva === 'usuarios' && esAdmin && (
        <UsuariosTab
          personas={personas}
          roles={roles}
          usuariosSistema={usuariosSistema}
          onRecargar={recargar}
          setError={setError}
        />
      )}
    </div>
  )
}