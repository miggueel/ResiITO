import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useDatos } from '../useDatos.js'
import Campo from '../components/Campo.jsx'
import { Cargando } from '../components/Estados.jsx'

const TEXTO = {
  activacion: {
    titulo: 'Activa tu cuenta',
    intro: 'Crea la contraseña con la que entrarás a ResiITO.',
    boton: 'Activar cuenta',
  },
  restablecimiento: {
    titulo: 'Elige una nueva contraseña',
    intro: 'Tu contraseña anterior seguirá funcionando hasta que guardes la nueva.',
    boton: 'Guardar contraseña',
  },
}

// Página de los enlaces enviados por correo: /activar/:token y /restablecer/:token
export default function Enlace({ tipo }) {
  const { token } = useParams()
  const { usuario, salir } = useAuth()
  const navegar = useNavigate()
  const enlace = useDatos(`/api/auth/enlace/${encodeURIComponent(token)}`)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const texto = TEXTO[tipo]

  async function enviar(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('password') !== f.get('confirmacion')) return setError('Las contraseñas no coinciden.')
    setEnviando(true)
    setError(null)
    try {
      const r = await api(`/api/auth/enlace/${encodeURIComponent(token)}`, {
        method: 'POST',
        body: { password: f.get('password') },
      })
      if (usuario) salir()
      navegar('/entrar', { replace: true, state: { aviso: r.mensaje, correo: r.correo } })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  if (enlace.cargando) return <Cargando texto="Revisando el enlace…" />

  if (enlace.error || enlace.datos?.tipo !== tipo) {
    return (
      <section className="acceso">
        <h1>Este enlace ya no sirve</h1>
        <p>
          {enlace.error?.status === 0
            ? enlace.error.message
            : 'Ya se usó o venció. Pide a la coordinación de residencias que te envíe uno nuevo.'}
        </p>
        <p><Link to="/entrar" className="boton boton--secundario">Ir a iniciar sesión</Link></p>
      </section>
    )
  }

  return (
    <section className="acceso">
      <h1>{texto.titulo}</h1>
      <p className="acceso-intro">
        Hola, {enlace.datos.nombre}. {texto.intro}
      </p>
      <form className="hoja formulario" onSubmit={enviar}>
        <Campo etiqueta="Correo" value={enlace.datos.correo} readOnly autoComplete="username" />
        <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="new-password" minLength={12} required autoFocus ayuda="Al menos 12 caracteres." />
        <Campo etiqueta="Repite la contraseña" name="confirmacion" type="password" autoComplete="new-password" minLength={12} required />
        {error && <p className="error-formulario" role="alert">{error}</p>}
        <button type="submit" className="boton boton--primario boton--ancho" disabled={enviando}>
          {enviando ? 'Guardando…' : texto.boton}
        </button>
      </form>
    </section>
  )
}
