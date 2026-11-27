import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function FamiliasTab({ personas, familias, onRecargar, setError }) {
  const [nombreFamilia, setNombreFamilia] = useState('')
  const [telefonoHogar, setTelefonoHogar] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [familiaId, setFamiliaId] = useState('')
  const [parentesco, setParentesco] = useState('cabeza_hogar')
  const [guardando, setGuardando] = useState(false)

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
          <li key={familia.id} style={{ marginBottom: 12 }}>
            <strong>{familia.nombre_familia}</strong>
            {familia.telefono_hogar ? ` — Tel: ${familia.telefono_hogar}` : ''}
            <ul>
              {(familia.persona_familia || []).map((rel, idx) => (
                <li key={`${familia.id}-${rel.personas?.id || idx}`}>
                  {rel.personas ? `${rel.personas.nombres} ${rel.personas.apellidos}` : 'Persona'} —{' '}
                  <em>{rel.parentesco}</em>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}