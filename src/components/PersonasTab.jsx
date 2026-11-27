import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PersonasTab({ personas, onRecargar, setError }) {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [telefono, setTelefono] = useState('')
  const [etapa, setEtapa] = useState('visita')
  const [filtroEtapa, setFiltroEtapa] = useState('todas')
  const [guardando, setGuardando] = useState(false)

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

  const personasFiltradas =
    filtroEtapa === 'todas' ? personas : personas.filter((p) => p.etapa === filtroEtapa)

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
        <h3 style={{ margin: 0 }}>Personas ({personasFiltradas.length})</h3>
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
          <li key={persona.id} style={{ marginBottom: 8 }}>
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
          </li>
        ))}
      </ul>
    </section>
  )
}