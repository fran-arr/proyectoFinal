import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './LoginForm.module.css'

export default function LoginForm({ error, setError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

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
      navigate('/', { replace: true }) // siempre entrar al panel de inicio
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          GESTIÓN<span className={styles.titleAccent}>IGLESIA</span>
        </h1>
      </header>

      <main className={styles.card}>
        <p className={styles.subtitle}>Inicia sesión con tu cuenta registrada</p>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Correo electrónico</span>
            <input
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Contraseña</span>
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className={styles.submit} disabled={cargando}>
            {cargando ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </main>
    </div>
  )
}
