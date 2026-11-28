import { Link, Navigate } from 'react-router-dom'
import { INICIO_POR_ROL, useAuth } from '../auth.jsx'
import Trayecto from '../components/Trayecto.jsx'
import ListaVacantes from '../components/ListaVacantes.jsx'

export default function Inicio() {
  const { usuario } = useAuth()
  if (usuario && usuario.rol !== 'alumno' && INICIO_POR_ROL[usuario.rol]) return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />

  return (
    <>
      <section className="portada">
        <div className="portada-texto">
          <h1>De la vacante a la liberación, en un solo expediente.</h1>
          <p>
            Encuentra dónde hacer tu residencia profesional, entrega tus reportes y recibe las
            observaciones de tu asesor y tu revisor en un mismo lugar. La coordinación del
            Tecnológico de Oaxaca da de alta las cuentas y valida cada paso.
          </p>
          <div className="acciones">
            {usuario ? (
              <Link to="/alumno" className="boton boton--primario">Ver mi residencia</Link>
            ) : (
              <>
                <Link to="/entrar" className="boton boton--primario">Iniciar sesión</Link>
                <a href="#vacantes-titulo" className="boton boton--secundario">Ver vacantes abiertas</a>
              </>
            )}
          </div>
        </div>
        <div className="portada-trayecto">
          <Trayecto estado="liberada" animado />
        </div>
      </section>

      <ListaVacantes
        accion={() =>
          usuario ? (
            <Link to="/alumno/vacantes" className="boton boton--secundario">Postularme</Link>
          ) : (
            <Link to="/entrar" className="enlace">Inicia sesión para postularte</Link>
          )
        }
      />
    </>
  )
}
