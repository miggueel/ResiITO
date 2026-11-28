import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import Icono from './Iconos.jsx'

// Un alumno aceptado en un proyecto ya no se postula: solo da seguimiento
const NAV_ALUMNO_EN_RESIDENCIA = [
  ['/alumno', 'Mi residencia', 'inicio'],
  ['/alumno/reportes', 'Reportes', 'documento'],
]

const NAV = {
  alumno: [
    ['/alumno', 'Mi residencia', 'inicio'],
    ['/alumno/vacantes', 'Vacantes', 'maletin'],
    ['/alumno/postulaciones', 'Postulaciones', 'enviar'],
    ['/alumno/reportes', 'Reportes', 'documento'],
  ],
  empresa: [
    ['/empresa', 'Mis proyectos', 'maletin'],
    ['/empresa/postulaciones', 'Postulaciones', 'bandeja'],
    ['/empresa/residentes', 'Residentes', 'personas'],
  ],
  docente: [
    ['/docente', 'Mis residentes', 'personas'],
    ['/docente/solicitudes', 'Solicitudes', 'mensaje'],
  ],
  coordinador: [
    ['/coordinacion', 'Proyectos', 'maletin'],
    ['/coordinacion/postulaciones', 'Postulaciones', 'bandeja'],
    ['/coordinacion/residencias', 'Residencias', 'ruta'],
    ['/coordinacion/reportes', 'Reportes', 'documento'],
    ['/coordinacion/solicitudes', 'Solicitudes', 'mensaje'],
    ['/coordinacion/evaluaciones', 'Evaluaciones', 'estrella'],
    ['/coordinacion/usuarios', 'Usuarios', 'usuarioEngrane'],
  ],
}

const PUBLICO = [['/', 'Vacantes', 'maletin']]

const ROL = { alumno: 'Alumno', empresa: 'Empresa', coordinador: 'Coordinación', docente: 'Docente' }

const CLAVE_PLEGADA = 'resiito.lateral-plegada'

export default function Layout() {
  const { usuario, salir, expirada } = useAuth()
  const navegar = useNavigate()
  const enlaces = !usuario
    ? PUBLICO
    : usuario.rol === 'alumno' && usuario.en_residencia
      ? NAV_ALUMNO_EN_RESIDENCIA
      : NAV[usuario.rol] ?? []

  // Escritorio: barra plegada (solo íconos) o desplegada; se recuerda la preferencia
  const [plegada, setPlegada] = useState(() => localStorage.getItem(CLAVE_PLEGADA) === '1')
  // Móvil: el menú se abre encima del contenido
  const [abierta, setAbierta] = useState(false)
  const botonMenu = useRef(null)
  const lateral = useRef(null)

  const alternarPlegada = () => {
    setPlegada((p) => {
      localStorage.setItem(CLAVE_PLEGADA, p ? '0' : '1')
      return !p
    })
  }

  const cerrarMenu = () => {
    setAbierta(false)
    botonMenu.current?.focus()
  }

  useEffect(() => {
    if (!abierta) return
    lateral.current?.querySelector('a, button')?.focus()
    const alTeclear = (e) => {
      if (e.key === 'Escape') {
        setAbierta(false)
        botonMenu.current?.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierta])

  // Al elegir una sección en el celular, el menú se cierra
  const alNavegar = () => setAbierta(false)

  const texto = (t) => <span className="lateral-texto">{t}</span>

  return (
    <div className={`app${plegada ? ' app--plegada' : ''}${abierta ? ' app--abierta' : ''}`}>
      <a href="#contenido" className="saltar">Saltar al contenido</a>

      <header className="cabecera-movil">
        <button
          ref={botonMenu}
          type="button"
          className="boton-lateral"
          aria-expanded={abierta}
          aria-controls="lateral"
          aria-label="Abrir menú"
          onClick={() => setAbierta(true)}
        >
          <Icono nombre="menu" />
        </button>
        <Link to="/" className="marca">ResiITO</Link>
      </header>

      <aside id="lateral" ref={lateral} className="lateral" aria-label="Menú lateral">
        <div className="lateral-cabeza">
          <Link to="/" className="marca" onClick={alNavegar} aria-label="ResiITO, inicio">
            <span className="marca-larga">ResiITO</span>
            <span className="marca-corta" aria-hidden="true">R</span>
          </Link>
          <button
            type="button"
            className="boton-lateral boton-lateral--plegar"
            aria-expanded={!plegada}
            aria-controls="lateral"
            aria-label={plegada ? 'Desplegar menú' : 'Plegar menú'}
            title={plegada ? 'Desplegar menú' : 'Plegar menú'}
            onClick={alternarPlegada}
          >
            <Icono nombre={plegada ? 'desplegar' : 'plegar'} />
          </button>
          <button type="button" className="boton-lateral boton-lateral--cerrar" aria-label="Cerrar menú" onClick={cerrarMenu}>
            <Icono nombre="cerrar" />
          </button>
        </div>

        <nav className="lateral-nav" aria-label="Principal">
          {enlaces.map(([ruta, nombre, icono], i) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={i === 0}
              className="lateral-enlace"
              title={plegada ? nombre : undefined}
              onClick={alNavegar}
            >
              <Icono nombre={icono} />
              {texto(nombre)}
            </NavLink>
          ))}
        </nav>

        <div className="lateral-pie">
          {usuario ? (
            <>
              <NavLink to="/cuenta" className="lateral-enlace lateral-usuario" title={plegada ? 'Mi cuenta' : undefined} onClick={alNavegar}>
                <Icono nombre="usuario" />
                <span className="lateral-texto">
                  <strong>{usuario.nombre}</strong>
                  <small>{ROL[usuario.rol]}</small>
                </span>
              </NavLink>
              <button
                type="button"
                className="lateral-enlace"
                title={plegada ? 'Cerrar sesión' : undefined}
                onClick={() => {
                  setAbierta(false)
                  salir()
                  navegar('/')
                }}
              >
                <Icono nombre="salir" />
                {texto('Cerrar sesión')}
              </button>
            </>
          ) : (
            <NavLink to="/entrar" className="lateral-enlace lateral-enlace--destacado" title={plegada ? 'Iniciar sesión' : undefined} onClick={alNavegar}>
              <Icono nombre="entrar" />
              {texto('Iniciar sesión')}
            </NavLink>
          )}
        </div>
      </aside>

      {abierta && <div className="velo" aria-hidden="true" onClick={cerrarMenu} />}

      <div className="principal">
        {expirada && (
          <p className="franja" role="alert">
            Tu sesión terminó. <Link to="/entrar">Inicia sesión de nuevo</Link> para continuar.
          </p>
        )}
        <main id="contenido" className="contenido" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="pie">
          <p>ResiITO, plataforma de residencias profesionales del Instituto Tecnológico de Oaxaca.</p>
        </footer>
      </div>
    </div>
  )
}
