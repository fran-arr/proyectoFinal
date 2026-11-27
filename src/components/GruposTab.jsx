import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function GruposTab({ personas, grupos, onRecargar, setError }) {
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [tipoGrupo, setTipoGrupo] = useState('celula')
  const [diaHorario, setDiaHorario] = useState('')
  const [grupoPadreId, setGrupoPadreId] = useState('')

  const [personaId, setPersonaId] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [rolEnGrupo, setRolEnGrupo] = useState('integrante')
  const [guardando, setGuardando] = useState(false)

  async function handleAgregarGrupo(e) {
    e.preventDefault()
    if (!nombreGrupo.trim()) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('grupos').insert([
      {
        nombre: nombreGrupo.trim(),
        tipo: tipoGrupo,
        dia_horario: diaHorario.trim() || null,
        grupo_padre_id: grupoPadreId ? Number(grupoPadreId) : null,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setNombreGrupo('')
    setTipoGrupo('celula')
    setDiaHorario('')
    setGrupoPadreId('')
    onRecargar()
  }

  async function handleAsignarPersona(e) {
    e.preventDefault()
    if (!personaId || !grupoId) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('grupo_miembros').insert([
      {
        persona_id: Number(personaId),
        grupo_id: Number(grupoId),
        rol_en_grupo: rolEnGrupo,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setPersonaId('')
    setGrupoId('')
    setRolEnGrupo('integrante')
    onRecargar()
  }

  return (
    <section>
      <h2>Crear grupo (célula, red, G12, ministerio)</h2>
      <form onSubmit={handleAgregarGrupo} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Nombre del grupo *"
          value={nombreGrupo}
          onChange={(e) => setNombreGrupo(e.target.value)}
          required
        />
        <select value={tipoGrupo} onChange={(e) => setTipoGrupo(e.target.value)}>
          <option value="celula">Célula</option>
          <option value="red">Red</option>
          <option value="g12">G12</option>
          <option value="ministerio">Ministerio</option>
        </select>
        <input
          type="text"
          placeholder="Día y horario"
          value={diaHorario}
          onChange={(e) => setDiaHorario(e.target.value)}
        />
        <select value={grupoPadreId} onChange={(e) => setGrupoPadreId(e.target.value)}>
          <option value="">-- Grupo padre (opcional) --</option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre} ({g.tipo})
            </option>
          ))}
        </select>
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Crear grupo'}
        </button>
      </form>

      <h3>Asignar persona a grupo</h3>
      <form onSubmit={handleAsignarPersona} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} required>
          <option value="">-- Selecciona persona --</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos} ({p.etapa})
            </option>
          ))}
        </select>

        <select value={grupoId} onChange={(e) => setGrupoId(e.target.value)} required>
          <option value="">-- Selecciona grupo --</option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre} ({g.tipo})
            </option>
          ))}
        </select>

        <select value={rolEnGrupo} onChange={(e) => setRolEnGrupo(e.target.value)}>
          <option value="integrante">Integrante</option>
          <option value="co_lider">Co-líder</option>
          <option value="lider">Líder</option>
        </select>

        <button type="submit" disabled={guardando}>
          Vincular a grupo
        </button>
      </form>

      <h3>Grupos registrados ({grupos.length})</h3>
      <ul style={{ paddingLeft: 18 }}>
        {grupos.map((grupo) => (
          <li key={grupo.id} style={{ marginBottom: 12 }}>
            <strong>{grupo.nombre}</strong> [{grupo.tipo}]
            {grupo.dia_horario ? ` — ${grupo.dia_horario}` : ''}
            {grupo.grupo_padre ? ` — Padre: ${grupo.grupo_padre.nombre}` : ''}
            <ul>
              {(grupo.grupo_miembros || []).map((rel, idx) => (
                <li key={`${grupo.id}-${rel.personas?.id || idx}`}>
                  {rel.personas ? `${rel.personas.nombres} ${rel.personas.apellidos}` : 'Persona'} —{' '}
                  <em>{rel.rol_en_grupo}</em>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}