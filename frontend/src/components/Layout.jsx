import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

const NAV = {
  alumno: [
    ['/alumno', 'Mi residencia'],
    ['/alumno/vacantes', 'Vacantes'],
    ['/alumno/postulaciones', 'Postulaciones'],
    ['/alumno/reportes', 'Reportes'],
  ],
  empresa: [
    ['/empresa', 'Mis vacantes'],
    ['/empresa/postulaciones', 'Postulaciones'],
    ['/empresa/residentes', 'Residentes'],
  ],
  coordinador: [
    ['/coordinacion', 'Por aprobar'],
    ['/coordinacion/residencias', 'Residencias'],
    ['/coordinacion/reportes', 'Reportes'],
    ['/coordinacion/evaluaciones', 'Evaluaciones'],
  ],
}

const ROL = { alumno: 'Alumno', empresa: 'Empresa', coordinador: 'Coordinación' }

export default function Layout() {
  const { usuario, salir, expirada } = useAuth()
  const navegar = useNavigate()
  const enlaces = usuario ? NAV[usuario.rol] ?? [] : []

  return (
    <>
      <a href="#contenido" className="saltar">Saltar al contenido</a>
      <header className="barra">
        <div className="barra-interior">
          <Link to="/" className="marca" aria-label="ResiITO, inicio">ResiITO</Link>
          {usuario ? (
            <nav className="nav" aria-label="Principal">
              {enlaces.map(([ruta, texto], i) => (
                <NavLink key={ruta} to={ruta} end={i === 0}>{texto}</NavLink>
              ))}
            </nav>
          ) : (
            <nav className="nav" aria-label="Principal">
              <NavLink to="/" end>Vacantes</NavLink>
            </nav>
          )}
          <div className="sesion">
            {usuario ? (
              <>
                <span className="sesion-quien">
                  <strong>{usuario.nombre}</strong>
                  <small>{ROL[usuario.rol]}</small>
                </span>
                <button
                  type="button"
                  className="boton boton--tenue"
                  onClick={() => {
                    salir()
                    navegar('/')
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/entrar" className="boton boton--tenue">Iniciar sesión</Link>
                <Link to="/registro" className="boton boton--primario">Crear cuenta</Link>
              </>
            )}
          </div>
        </div>
      </header>
      {expirada && (
        <p className="franja" role="alert">
          Tu sesión expiró. <Link to="/entrar">Inicia sesión de nuevo</Link> para continuar.
        </p>
      )}
      <main id="contenido" className="contenido">
        <Outlet />
      </main>
      <footer className="pie">
        <p>ResiITO, plataforma de residencias profesionales del Instituto Tecnológico de Oaxaca.</p>
      </footer>
    </>
  )
}
