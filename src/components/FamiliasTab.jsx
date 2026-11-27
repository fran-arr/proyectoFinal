import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function FamiliasTab({ personas, familias, puedeBorrar, onRecargar, setError }) {
  const [nombreFamilia, setNombreFamilia] = useState('')
  const [telefonoHogar, setTelefonoHogar] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [familiaId, setFamiliaId] = useState('')
  const [parentesco, setParentesco] = useState('cabeza_hogar')
  const [guardando, setGuardando] = useState(false)

  // Edición de familia
  const [editId, setEditId] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [editTelefono, setEditTelefono] = useState('')

  async function handleAgregarFamilia(e) {
    e.preventDefault()
    if (!nombreFamilia.trim()) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('familias').insert([
      {
        nombre_familia: nombreFamilia.trim(),
        telefono_hogar: telefonoHogar.trim() || null,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setNombreFamilia('')
    setTelefonoHogar('')
    onRecargar()
  }

  function empezarEdicion(familia) {
    setEditId(familia.id)
    setEditNombre(familia.nombre_familia || '')
    setEditTelefono(familia.telefono_hogar || '')
  }

  async function handleGuardarEdicion(e, id) {
    e.preventDefault()
    if (!editNombre.trim()) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('familias')
      .update({
        nombre_familia: editNombre.trim(),
        telefono_hogar: editTelefono.trim() || null,
      })
      .eq('id', id)

    setGuardando(false)
    if (error) return setError(error.message)

    setEditId(null)
    onRecargar()
  }

  async function handleEliminarFamilia(id, nombre) {
    if (!window.confirm(`¿Eliminar la familia "${nombre}"?`)) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('familias').delete().eq('id', id)

    setGuardando(false)
    if (error) return setError(error.message)
    onRecargar()
  }

  async function handleAsignarFamilia(e) {
    e.preventDefault()
    if (!personaId || !familiaId) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('persona_familia').insert([
      {
        persona_id: Number(personaId),
        familia_id: Number(familiaId),
        parentesco,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setPersonaId('')
    setFamiliaId('')
    setParentesco('cabeza_hogar')
    onRecargar()
  }

  async function handleQuitarIntegrante(idFamilia, idPersona) {
    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('persona_familia')
      .delete()
      .eq('familia_id', idFamilia)
      .eq('persona_id', idPersona)

    setGuardando(false)
    if (error) return setError(error.message)
    onRecargar()
  }

  return (
    <section>
      <h2>Crear familia</h2>
      <form onSubmit={handleAgregarFamilia} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Nombre de familia *"
          value={nombreFamilia}
          onChange={(e) => setNombreFamilia(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Teléfono del hogar"
          value={telefonoHogar}
          onChange={(e) => setTelefonoHogar(e.target.value)}
        />
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Crear familia'}
        </button>
      </form>

      <h3>Asignar persona a familia</h3>
      <form onSubmit={handleAsignarFamilia} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} required>
          <option value="">-- Selecciona persona --</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos} ({p.etapa})
            </option>
          ))}
        </select>

        <select value={familiaId} onChange={(e) => setFamiliaId(e.target.value)} required>
          <option value="">-- Selecciona familia --</option>
          {familias.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre_familia}
            </option>
          ))}
        </select>

        <select value={parentesco} onChange={(e) => setParentesco(e.target.value)}>
          <option value="cabeza_hogar">Cabeza de hogar</option>
          <option value="conyuge">Cónyuge</option>
          <option value="hijo">Hijo/a</option>
          <option value="otro">Otro</option>
        </select>

        <button type="submit" disabled={guardando}>
          Vincular a familia
        </button>
      </form>

      <h3>Familias e integrantes ({familias.length})</h3>
      <ul style={{ paddingLeft: 18 }}>
        {familias.map((familia) => (
          <li key={familia.id} style={{ marginBottom: 14 }}>
            {editId === familia.id ? (
              <form
                onSubmit={(e) => handleGuardarEdicion(e, familia.id)}
                style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                />
                <input
                  type="text"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  placeholder="Teléfono del hogar"
                />
                <button type="submit" disabled={guardando}>
                  Guardar
                </button>
                <button type="button" onClick={() => setEditId(null)}>
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <strong>{familia.nombre_familia}</strong>
                {familia.telefono_hogar ? ` — Tel: ${familia.telefono_hogar}` : ''}
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => empezarEdicion(familia)}
                  style={{ marginLeft: 8 }}
                >
                  Editar
                </button>
                {puedeBorrar && (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => handleEliminarFamilia(familia.id, familia.nombre_familia)}
                    style={{ marginLeft: 6, color: 'crimson' }}
                  >
                    Eliminar
                  </button>
                )}
              </>
            )}

            <ul>
              {(familia.persona_familia || []).map((rel, idx) => (
                <li key={`${familia.id}-${rel.personas?.id || idx}`}>
                  {rel.personas ? `${rel.personas.nombres} ${rel.personas.apellidos}` : 'Persona'} —{' '}
                  <em>{rel.parentesco}</em>
                  {rel.personas?.id && (
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => handleQuitarIntegrante(familia.id, rel.personas.id)}
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