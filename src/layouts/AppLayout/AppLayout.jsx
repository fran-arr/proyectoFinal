import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from '../../components/Icon/Icon'
import styles from './AppLayout.module.css'

export default function AppLayout({ modulos, nombreUsuario, rol, error, onCerrarSesion }) {
  const location = useLocation()
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const [modulosAbiertos, setModulosAbiertos] = useState(true)

  const moduloActual = modulos.find((m) => location.pathname.startsWith(m.ruta))
  const tituloPagina = location.pathname.startsWith('/perfil')
    ? 'Mi perfil'
    : moduloActual
      ? moduloActual.label
      : 'Inicio'
  const iniciales = nombreUsuario
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  const cerrarMenuMovil = () => setMenuMovilAbierto(false)
  const claseEnlace = ({ isActive }) => `${styles.link} ${isActive ? styles.linkActivo : ''}`

  return (
    <div className={styles.layout}>
      {/* Fondo oscuro al abrir el menú en celular */}
      {menuMovilAbierto && <div className={styles.overlay} onClick={cerrarMenuMovil} />}

      <aside className={`${styles.sidebar} ${menuMovilAbierto ? styles.sidebarAbierto : ''}`}>
        <div className={styles.marca}>
          <span>
            GESTIÓN<span className={styles.marcaAcento}>IGLESIA</span>
          </span>
          <button
            type="button"
            className={styles.botonCerrar}
            onClick={cerrarMenuMovil}
            aria-label="Cerrar menú"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Menú principal">
          <NavLink to="/" end className={claseEnlace} onClick={cerrarMenuMovil}>
            <Icon name="home" />
            Inicio
          </NavLink>

          <button
            type="button"
            className={styles.grupoBoton}
            onClick={() => setModulosAbiertos((abierto) => !abierto)}
            aria-expanded={modulosAbiertos}
            aria-controls="menu-modulos"
          >
            <Icon name="grid" />
            Módulos
            <Icon
              name="chevronDown"
              size={16}
              className={`${styles.chevron} ${modulosAbiertos ? styles.chevronAbierto : ''}`}
            />
          </button>

          {modulosAbiertos && (
            <ul id="menu-modulos" className={styles.submenu}>
              {modulos.map((m) => (
                <li key={m.id}>
                  <NavLink to={m.ruta} className={claseEnlace} onClick={cerrarMenuMovil}>
                    <Icon name={m.icono} size={18} />
                    {m.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className={styles.usuario}>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `${styles.usuarioEnlace} ${isActive ? styles.usuarioEnlaceActivo : ''}`
            }
            onClick={cerrarMenuMovil}
            title="Ver mi perfil"
          >
            <span className={styles.avatar} aria-hidden="true">
              {iniciales || '?'}
            </span>
            <span className={styles.usuarioTexto}>
              <strong>{nombreUsuario}</strong>
              <span>{rol || 'sin perfil'}</span>
            </span>
          </NavLink>
          <button
            type="button"
            className={styles.botonSalir}
            onClick={onCerrarSesion}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <div className={styles.principal}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.botonMenu}
            onClick={() => setMenuMovilAbierto(true)}
            aria-label="Abrir menú"
          >
            <Icon name="menu" />
          </button>
          <h1 className={styles.titulo}>{tituloPagina}</h1>
        </header>

        <main className={styles.contenido}>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
