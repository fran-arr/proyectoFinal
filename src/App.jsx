import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { modulosVisibles } from './config/modulos'
import AppLayout from './layouts/AppLayout/AppLayout'
import Inicio from './pages/Inicio/Inicio'
import LoginForm from './components/LoginForm/LoginForm'
import PersonasTab from './components/PersonasTab'
import SeguimientosTab from './components/SeguimientosTab'
import GruposTab from './components/GruposTab'
import FamiliasTab from './components/FamiliasTab'
import ReunionesTab from './components/ReunionesTab'
import UsuariosTab from './components/UsuariosTab'

export default function App() {
  const [session, setSession] = useState(null)
  const [perfilUsuario, setPerfilUsuario] = useState(null)
  const [cargandoAuth, setCargandoAuth] = useState(true)
  const [perfilListo, setPerfilListo] = useState(false)

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
      setPerfilListo(true)
      return
    }

    if (usuarioData && usuarioData.activo === false) {
      setError('Tu cuenta está suspendida. Contacta al administrador.')
      await supabase.auth.signOut()
      return
    }

    setPerfilUsuario(usuarioData || null)
    setPerfilListo(true)
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
        setPerfilListo(false)
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

  // Permisos según el rol
  const rolActual = perfilUsuario?.roles?.nombre
  const esAdmin = rolActual === 'admin'
  const puedeBorrar = rolActual === 'admin' || rolActual === 'pastor'
  const modulos = modulosVisibles(esAdmin)

  const nombreUsuario = perfilUsuario?.personas
    ? `${perfilUsuario.personas.nombres} ${perfilUsuario.personas.apellidos}`
    : session.user.email

  const propsComunes = { personas, puedeBorrar, onRecargar: recargar, setError }

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            modulos={modulos}
            nombreUsuario={nombreUsuario}
            rol={rolActual}
            error={error}
            onCerrarSesion={() => supabase.auth.signOut()}
          />
        }
      >
        <Route
          index
          element={
            <Inicio
              perfilUsuario={perfilUsuario}
              emailSesion={session.user.email}
              ultimoAcceso={session.user.last_sign_in_at}
              modulos={modulos}
              personas={personas}
              seguimientos={seguimientos}
              grupos={grupos}
              familias={familias}
              reuniones={reuniones}
            />
          }
        />
        <Route path="personas" element={<PersonasTab {...propsComunes} />} />
        <Route
          path="seguimientos"
          element={<SeguimientosTab {...propsComunes} seguimientos={seguimientos} />}
        />
        <Route path="grupos" element={<GruposTab {...propsComunes} grupos={grupos} />} />
        <Route path="familias" element={<FamiliasTab {...propsComunes} familias={familias} />} />
        <Route path="reuniones" element={<ReunionesTab {...propsComunes} reuniones={reuniones} />} />
        <Route
          path="usuarios"
          element={
            !perfilListo ? (
              <p>Cargando...</p>
            ) : esAdmin ? (
              <UsuariosTab
                personas={personas}
                roles={roles}
                usuariosSistema={usuariosSistema}
                onRecargar={recargar}
                setError={setError}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
