import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function GruposTab({ personas, grupos, puedeBorrar, onRecargar, setError }) {
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [tipoGrupo, setTipoGrupo] = useState('celula')
  const [diaHorario, setDiaHorario] = useState('')
  const [grupoPadreId, setGrupoPadreId] = useState('')

  const [personaId, setPersonaId] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [rolEnGrupo, setRolEnGrupo] = useState('integrante')
  const [guardando, setGuardando] = useState(false)

  // Edición de grupo
  const [editGrupoId, setEditGrupoId] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [editTipo, setEditTipo] = useState('celula')
  const [editHorario, setEditHorario] = useState('')

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

  function empezarEditarGrupo(grupo) {
    setEditGrupoId(grupo.id)
    setEditNombre(grupo.nombre || '')
    setEditTipo(grupo.tipo || 'celula')
    setEditHorario(grupo.dia_horario || '')
  }

  async function handleGuardarGrupo(e, id) {
    e.preventDefault()
    if (!editNombre.trim()) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('grupos')
      .update({
        nombre: editNombre.trim(),
        tipo: editTipo,
        dia_horario: editHorario.trim() || null,
      })
      .eq('id', id)

    setGuardando(false)
    if (error) return setError(error.message)

    setEditGrupoId(null)
    onRecargar()
  }

  async function handleEliminarGrupo(id, nombre) {
    if (!window.confirm(`¿Eliminar el grupo "${nombre}"?`)) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('grupos').delete().eq('id', id)

    setGuardando(false)
    if (error) return setError(error.message)
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

  async function handleQuitarIntegrante(idGrupo, idPersona) {
    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('grupo_miembros')
      .delete()
      .eq('grupo_id', idGrupo)
      .eq('persona_id', idPersona)

    setGuardando(false)
    if (error) return setError(error.message)
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
          <li key={grupo.id} style={{ marginBottom: 14 }}>
            {editGrupoId === grupo.id ? (
              <form
                onSubmit={(e) => handleGuardarGrupo(e, grupo.id)}
                style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                />
                <select value={editTipo} onChange={(e) => setEditTipo(e.target.value)}>
                  <option value="celula">Célula</option>
                  <option value="red">Red</option>
                  <option value="g12">G12</option>
                  <option value="ministerio">Ministerio</option>
                </select>
                <input
                  type="text"
                  value={editHorario}
                  onChange={(e) => setEditHorario(e.target.value)}
                  placeholder="Día y horario"
                />
                <button type="submit" disabled={guardando}>
                  Guardar
                </button>
                <button type="button" onClick={() => setEditGrupoId(null)}>
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <strong>{grupo.nombre}</strong> [{grupo.tipo}]
                {grupo.dia_horario ? ` — ${grupo.dia_horario}` : ''}
                {grupo.grupo_padre ? ` — Padre: ${grupo.grupo_padre.nombre}` : ''}
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => empezarEditarGrupo(grupo)}
                  style={{ marginLeft: 8 }}
                >
                  Editar
                </button>
                {puedeBorrar && (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => handleEliminarGrupo(grupo.id, grupo.nombre)}
                    style={{ marginLeft: 6, color: 'crimson' }}
                  >
                    Eliminar
                  </button>
                )}
              </>
            )}

            <ul>
              {(grupo.grupo_miembros || []).map((rel, idx) => (
                <li key={`${grupo.id}-${rel.personas?.id || idx}`}>
                  {rel.personas ? `${rel.personas.nombres} ${rel.personas.apellidos}` : 'Persona'} —{' '}
                  <em>{rel.rol_en_grupo}</em>
                  {rel.personas?.id && (
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => handleQuitarIntegrante(grupo.id, rel.personas.id)}
                      style={{ marginLeft: 8, fontSize: 12 }}
                    >
                      Quitar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}