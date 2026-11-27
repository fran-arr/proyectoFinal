import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginForm({ error, setError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setCargando(false)
    if (loginError) {
      setError(loginError.message)
    } else {
      setPassword('')
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 420, margin: '40px auto' }}>
      <h1>Gestión de Iglesia</h1>
      <p>Inicia sesión con tu cuenta registrada.</p>

      {error && (
        <p style={{ color: 'crimson', background: '#ffeef0', padding: 10, borderRadius: 6 }}>
          Error: {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}