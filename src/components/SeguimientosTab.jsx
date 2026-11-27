import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SeguimientosTab({ personas, seguimientos, onRecargar, setError }) {
  const [personaId, setPersonaId] = useState('')
  const [liderId, setLiderId] = useState('')
  const [tipo, setTipo] = useState('llamada')
  const [resultado, setResultado] = useState('contactado')
  const [fechaContacto, setFechaContacto] = useState(() => new Date().toISOString().slice(0, 10))
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleAgregar(e) {
    e.preventDefault()
    if (!personaId) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('seguimientos').insert([
      {
        persona_id: Number(personaId),
        lider_id: liderId ? Number(liderId) : null,
        fecha_contacto: fechaContacto || new Date().toISOString().slice(0, 10),
        tipo,
        resultado,
        notas: notas.trim() || null,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setPersonaId('')
    setLiderId('')
    setTipo('llamada')
    setResultado('contactado')
    setNotas('')
    onRecargar()
  }

  return (
    <section>
      <h2>Registrar seguimiento pastoral</h2>
      <form onSubmit={handleAgregar} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} required>
          <option value="">-- Persona a seguir * --</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos} ({p.etapa})
            </option>
          ))}
        </select>

        <select value={liderId} onChange={(e) => setLiderId(e.target.value)}>
          <option value="">-- Líder / responsable (opcional) --</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos}
            </option>
          ))}
        </select>

        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="llamada">Llamada</option>
          <option value="visita_hogar">Visita al hogar</option>
          <option value="mensaje">Mensaje</option>
          <option value="reunion">Reunión</option>
        </select>

        <select value={resultado} onChange={(e) => setResultado(e.target.value)}>
          <option value="contactado">Contactado</option>
          <option value="sin_respuesta">Sin respuesta</option>
          <option value="reprogramado">Reprogramado</option>
          <option value="completado">Completado</option>
        </select>

        <input
          type="date"
          value={fechaContacto}
          onChange={(e) => setFechaContacto(e.target.value)}
        />

        <input
          type="text"
          placeholder="Notas del contacto"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Registrar seguimiento'}
        </button>
      </form>

      <h3>Historial de seguimientos ({seguimientos.length})</h3>
      <ul style={{ paddingLeft: 18 }}>
        {seguimientos.map((seg) => (
          <li key={seg.id} style={{ marginBottom: 8 }}>
            <strong>{seg.fecha_contacto}</strong> —{' '}
            <strong>
              {seg.persona ? `${seg.persona.nombres} ${seg.persona.apellidos}` : 'Persona'}
            </strong>{' '}
            [{seg.tipo} / {seg.resultado}]
            {seg.lider ? ` — Responsable: ${seg.lider.nombres} ${seg.lider.apellidos}` : ''}
            {seg.notas ? ` — "${seg.notas}"` : ''}
          </li>
        ))}
      </ul>
    </section>
  )
}