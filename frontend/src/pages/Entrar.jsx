import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { INICIO_POR_ROL, useAuth } from '../auth.jsx'
import Campo from '../components/Campo.jsx'

export default function Entrar() {
  const { usuario, entrar } = useAuth()
  const navegar = useNavigate()
  const desde = useLocation().state?.desde
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={INICIO_POR_ROL[usuario.rol] ?? '/'} replace />

  async function enviar(e) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    setEnviando(true)
    setError(null)
    try {
      const u = await entrar(datos.get('correo'), datos.get('password'))
      const inicio = INICIO_POR_ROL[u.rol] ?? '/'
      // Volver a la página que pidió login, solo si pertenece a su rol
      navegar(desde?.startsWith(inicio) ? desde : inicio, { replace: true })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <section className="acceso">
      <h1>Iniciar sesión</h1>
      <form className="hoja formulario" onSubmit={enviar}>
        <Campo etiqueta="Correo" name="correo" type="email" autoComplete="email" required autoFocus />
        <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" required />
        {error && <p className="error-formulario" role="alert">{error}</p>}
        <button type="submit" className="boton boton--primario boton--ancho" disabled={enviando}>
          {enviando ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>
      <p className="acceso-pie">
        ¿Aún no tienes cuenta? <Link to="/registro">Crea una como alumno o empresa</Link>.
        Las cuentas de coordinación las da de alta el Tecnológico.
      </p>
    </section>
  )
}
