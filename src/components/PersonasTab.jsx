import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PersonasTab({ personas, puedeBorrar, onRecargar, setError }) {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [telefono, setTelefono] = useState('')
  const [etapa, setEtapa] = useState('visita')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState('todas')
  const [guardando, setGuardando] = useState(false)

  // Estado de edición
  const [editandoId, setEditandoId] = useState(null)
  const [editNombres, setEditNombres] = useState('')
  const [editApellidos, setEditApellidos] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editEtapa, setEditEtapa] = useState('visita')

  async function handleAgregar(e) {
    e.preventDefault()
    if (!nombres.trim() || !apellidos.trim()) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('personas').insert([
      {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim() || null,
        etapa,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setNombres('')
    setApellidos('')
    setTelefono('')
    setEtapa('visita')
    onRecargar()
  }

  function empezarEdicion(persona) {
    setEditandoId(persona.id)
    setEditNombres(persona.nombres || '')
    setEditApellidos(persona.apellidos || '')
    setEditTelefono(persona.telefono || '')
    setEditEtapa(persona.etapa || 'visita')
  }

  async function handleGuardarEdicion(e, personaId) {
    e.preventDefault()
    if (!editNombres.trim() || !editApellidos.trim()) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('personas')
      .update({
        nombres: editNombres.trim(),
        apellidos: editApellidos.trim(),
        telefono: editTelefono.trim() || null,
        etapa: editEtapa,
      })
      .eq('id', personaId)

    setGuardando(false)
    if (error) return setError(error.message)

    setEditandoId(null)
    onRecargar()
  }

  async function handleCambiarEtapa(personaId, nuevaEtapa) {
    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('personas')
      .update({ etapa: nuevaEtapa })
      .eq('id', personaId)

    setGuardando(false)
    if (error) return setError(error.message)
    onRecargar()
  }

  async function handleEliminar(personaId, nombreCompleto) {
    const confirmar = window.confirm(`¿Eliminar a ${nombreCompleto}? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('personas').delete().eq('id', personaId)

    setGuardando(false)
    if (error) return setError(error.message)
    onRecargar()
  }

  const texto = busqueda.trim().toLowerCase()
  const personasFiltradas = personas.filter((p) => {
    const coincideEtapa = filtroEtapa === 'todas' || p.etapa === filtroEtapa
    const nombreCompleto = `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase()
    const tel = (p.telefono || '').toLowerCase()
    const coincideTexto = !texto || nombreCompleto.includes(texto) || tel.includes(texto)
    return coincideEtapa && coincideTexto
  })

  return (
    <section>
      <h2>Registrar persona</h2>
      <form onSubmit={handleAgregar} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Nombres *"
          value={nombres}
          onChange={(e) => setNombres(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Apellidos *"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <select value={etapa} onChange={(e) => setEtapa(e.target.value)}>
          <option value="visita">Visita</option>
          <option value="en_seguimiento">En seguimiento</option>
          <option value="miembro">Miembro</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar persona'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>Personas ({personasFiltradas.length})</h3>
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)}>
          <option value="todas">Todas las etapas</option>
          <option value="visita">Solo visitas</option>
          <option value="en_seguimiento">En seguimiento</option>
          <option value="miembro">Miembros</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      <ul style={{ paddingLeft: 18 }}>
        {personasFiltradas.map((persona) => (
          <li key={persona.id} style={{ marginBottom: 10 }}>
            {editandoId === persona.id ? (
              <form
                onSubmit={(e) => handleGuardarEdicion(e, persona.id)}
                style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  value={editNombres}
                  onChange={(e) => setEditNombres(e.target.value)}
                  required
                />
                <input
                  type="text"
                  value={editApellidos}
                  onChange={(e) => setEditApellidos(e.target.value)}
                  required
                />
                <input
                  type="text"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  placeholder="Teléfono"
                />
                <select value={editEtapa} onChange={(e) => setEditEtapa(e.target.value)}>
                  <option value="visita">Visita</option>
                  <option value="en_seguimiento">En seguimiento</option>
                  <option value="miembro">Miembro</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                <button type="submit" disabled={guardando}>
                  Guardar
                </button>
                <button type="button" onClick={() => setEditandoId(null)}>
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <strong>{persona.nombres} {persona.apellidos}</strong>
                {persona.telefono ? ` — Tel: ${persona.telefono}` : ''}{' '}
                <select
                  value={persona.etapa}
                  disabled={guardando}
                  onChange={(e) => handleCambiarEtapa(persona.id, e.target.value)}
                  style={{ marginLeft: 8 }}
                >
                  <option value="visita">Visita</option>
                  <option value="en_seguimiento">En seguimiento</option>
                  <option value="miembro">Miembro</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => empezarEdicion(persona)}
                  style={{ marginLeft: 8 }}
                >
                  Editar
                </button>
                {puedeBorrar && (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() =>
                      handleEliminar(persona.id, `${persona.nombres} ${persona.apellidos}`)
                    }
                    style={{ marginLeft: 6, color: 'crimson' }}
                  >
                    Eliminar
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}