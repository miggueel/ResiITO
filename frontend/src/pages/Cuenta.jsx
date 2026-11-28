import { useRef, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import Campo from '../components/Campo.jsx'
import Encabezado from '../components/Encabezado.jsx'
import { useAvisos } from '../components/Avisos.jsx'

const ROL = { alumno: 'Alumno', empresa: 'Empresa', coordinador: 'Coordinación', docente: 'Docente' }

export default function Cuenta() {
  const { usuario } = useAuth()
  const avisar = useAvisos()
  const formRef = useRef(null)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('password_nueva') !== f.get('confirmacion')) return setError('Las contraseñas nuevas no coinciden.')
    setEnviando(true)
    setError(null)
    try {
      await api('/api/auth/password', {
        method: 'PATCH',
        body: { password_actual: f.get('password_actual'), password_nueva: f.get('password_nueva') },
      })
      avisar('Contraseña actualizada.')
      formRef.current?.reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Encabezado titulo="Mi cuenta" />
      <div className="dos-columnas">
        <dl className="datos datos--lista">
          <div><dt>Nombre</dt><dd>{usuario.nombre}</dd></div>
          <div><dt>Correo</dt><dd>{usuario.correo}</dd></div>
          <div><dt>Tipo de cuenta</dt><dd>{ROL[usuario.rol]}</dd></div>
        </dl>
        <section aria-labelledby="cambiar-titulo">
          <h2 id="cambiar-titulo" className="subtitulo">Cambiar contraseña</h2>
          <form ref={formRef} className="hoja formulario" onSubmit={enviar}>
            <Campo etiqueta="Contraseña actual" name="password_actual" type="password" autoComplete="current-password" required />
            <Campo etiqueta="Nueva contraseña" name="password_nueva" type="password" autoComplete="new-password" minLength={12} required ayuda="Al menos 12 caracteres." />
            <Campo etiqueta="Repite la nueva contraseña" name="confirmacion" type="password" autoComplete="new-password" minLength={12} required />
            {error && <p className="error-formulario" role="alert">{error}</p>}
            <button type="submit" className="boton boton--primario" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </section>
      </div>
    </>
  )
}
