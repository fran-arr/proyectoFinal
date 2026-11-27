import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ReunionesTab({ personas, reuniones, puedeBorrar, onRecargar, setError }) {
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('servicio_regular')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [lugar, setLugar] = useState('')
  const [reunionId, setReunionId] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Edición de reunión
  const [editId, setEditId] = useState(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editCategoria, setEditCategoria] = useState('servicio_regular')
  const [editFecha, setEditFecha] = useState('')
  const [editLugar, setEditLugar] = useState('')

  async function handleAgregarReunion(e) {
    e.preventDefault()
    if (!titulo.trim()) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('reuniones').insert([
      {
        titulo: titulo.trim(),
        categoria,
        fecha: fecha || new Date().toISOString().slice(0, 10),
        lugar: lugar.trim() || null,
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setTitulo('')
    setCategoria('servicio_regular')
    setLugar('')
    onRecargar()
  }

  function empezarEdicion(reunion) {
    setEditId(reunion.id)
    setEditTitulo(reunion.titulo || '')
    setEditCategoria(reunion.categoria || 'servicio_regular')
    setEditFecha(reunion.fecha || '')
    setEditLugar(reunion.lugar || '')
  }

  async function handleGuardarEdicion(e, id) {
    e.preventDefault()
    if (!editTitulo.trim()) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('reuniones')
      .update({
        titulo: editTitulo.trim(),
        categoria: editCategoria,
        fecha: editFecha || new Date().toISOString().slice(0, 10),
        lugar: editLugar.trim() || null,
      })
      .eq('id', id)

    setGuardando(false)
    if (error) return setError(error.message)

    setEditId(null)
    onRecargar()
  }

  async function handleEliminarReunion(id, tituloReunion) {
    if (!window.confirm(`¿Eliminar la reunión "${tituloReunion}"?`)) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('reuniones').delete().eq('id', id)

    setGuardando(false)
    if (error) return setError(error.message)
    onRecargar()
  }

  async function handleRegistrarAsistencia(e) {
    e.preventDefault()
    if (!reunionId || !personaId) return

    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('asistencias').insert([
      {
        reunion_id: Number(reunionId),
        persona_id: Number(personaId),
      },
    ])

    setGuardando(false)
    if (error) return setError(error.message)

    setPersonaId('')
    onRecargar()
  }

  return (
    <section>
      <h2>Crear reunión o evento</h2>
      <form onSubmit={handleAgregarReunion} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Título * (ej. Culto Dominical)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="servicio_regular">Servicio regular</option>
          <option value="evento_especial">Evento especial</option>
          <option value="bautismo">Bautismo</option>
        </select>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <input
          type="text"
          placeholder="Lugar"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
        />
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Crear reunión'}
        </button>
      </form>

      <h3>Registrar asistencia (Check-in)</h3>
      <form onSubmit={handleRegistrarAsistencia} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={reunionId} onChange={(e) => setReunionId(e.target.value)} required>
          <option value="">-- Selecciona reunión --</option>
          {reuniones.map((r) => (
            <option key={r.id} value={r.id}>
              {r.fecha} — {r.titulo}
            </option>
          ))}
        </select>

        <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} required>
          <option value="">-- Selecciona persona --</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos} ({p.etapa})
            </option>
          ))}
        </select>

        <button type="submit" disabled={guardando}>
          Marcar asistencia
        </button>
      </form>

      <h3>Reuniones y asistentes ({reuniones.length})</h3>
      <ul style={{ paddingLeft: 18 }}>
        {reuniones.map((reunion) => (
          <li key={reunion.id} style={{ marginBottom: 14 }}>
            {editId === reunion.id ? (
              <form
                onSubmit={(e) => handleGuardarEdicion(e, reunion.id)}
                style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  required
                />
                <select value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)}>
                  <option value="servicio_regular">Servicio regular</option>
                  <option value="evento_especial">Evento especial</option>
                  <option value="bautismo">Bautismo</option>
                </select>
                <input
                  type="date"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                />
                <input
                  type="text"
                  value={editLugar}
                  onChange={(e) => setEditLugar(e.target.value)}
                  placeholder="Lugar"
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
                <strong>{reunion.fecha} — {reunion.titulo}</strong> [{reunion.categoria}]
                {reunion.lugar ? ` — ${reunion.lugar}` : ''}
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => empezarEdicion(reunion)}
                  style={{ marginLeft: 8 }}
                >
                  Editar
                </button>
                {puedeBorrar && (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => handleEliminarReunion(reunion.id, reunion.titulo)}
                    style={{ marginLeft: 6, color: 'crimson' }}
                  >
                    Eliminar
                  </button>
                )}
              </>
            )}

            <div>
              <strong>Asistentes ({(reunion.asistencias || []).length}):</strong>
              <ul>
                {(reunion.asistencias || []).map((asis, idx) => (
                  <li key={`${reunion.id}-${asis.personas?.id || idx}`}>
                    {asis.personas
                      ? `${asis.personas.nombres} ${asis.personas.apellidos} (${asis.personas.etapa})`
                      : 'Persona'}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}