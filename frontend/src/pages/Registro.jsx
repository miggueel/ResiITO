import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { INICIO_POR_ROL, useAuth } from '../auth.jsx'
import Campo from '../components/Campo.jsx'
import { CARRERAS } from '../formato.js'

export default function Registro() {
  const { usuario, entrar } = useAuth()
  const navegar = useNavigate()
  const [rol, setRol] = useState('alumno')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={INICIO_POR_ROL[usuario.rol] ?? '/'} replace />

  async function enviar(e) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    const opcional = (v) => (v?.trim() ? v.trim() : undefined)

    const cuerpo = { nombre: f.nombre, correo: f.correo, password: f.password, rol }
    if (rol === 'alumno') {
      Object.assign(cuerpo, {
        matricula: f.matricula,
        carrera: f.carrera,
        semestre: f.semestre ? Number.parseInt(f.semestre, 10) : undefined,
      })
    } else {
      Object.assign(cuerpo, {
        nombre_empresa: f.nombre_empresa,
        descripcion: opcional(f.descripcion),
        direccion: opcional(f.direccion),
        telefono: opcional(f.telefono),
      })
    }

    setEnviando(true)
    setError(null)
    try {
      await api('/api/auth/registro', { method: 'POST', body: cuerpo })
      const u = await entrar(f.correo, f.password)
      navegar(INICIO_POR_ROL[u.rol], { replace: true })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <section className="acceso acceso--ancho">
      <h1>Crear cuenta</h1>
      <form className="hoja formulario" onSubmit={enviar}>
        <fieldset className="selector-rol">
          <legend>Me registro como</legend>
          {[
            ['alumno', 'Alumno', 'Busco dónde hacer mi residencia'],
            ['empresa', 'Empresa', 'Quiero recibir residentes'],
          ].map(([valor, titulo, detalle]) => (
            <label key={valor} className="opcion-rol">
              <input type="radio" name="rol" value={valor} checked={rol === valor} onChange={() => setRol(valor)} />
              <span>
                <strong>{titulo}</strong>
                <small>{detalle}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="rejilla-campos">
          <Campo etiqueta={rol === 'alumno' ? 'Nombre completo' : 'Nombre del contacto'} name="nombre" autoComplete="name" required />
          <Campo etiqueta="Correo" name="correo" type="email" autoComplete="email" required />
          <Campo
            etiqueta="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            ayuda="Al menos 12 caracteres."
          />

          {rol === 'alumno' ? (
            <>
              <Campo etiqueta="Número de control" name="matricula" required />
              <Campo etiqueta="Carrera" name="carrera" list="carreras-registro" required />
              <datalist id="carreras-registro">
                {CARRERAS.map((c) => <option key={c} value={c} />)}
              </datalist>
              <Campo etiqueta="Semestre (opcional)" name="semestre" type="number" min={1} max={14} inputMode="numeric" />
            </>
          ) : (
            <>
              <Campo etiqueta="Nombre de la empresa" name="nombre_empresa" autoComplete="organization" required />
              <Campo etiqueta="Teléfono (opcional)" name="telefono" type="tel" autoComplete="tel" />
              <Campo etiqueta="Dirección (opcional)" name="direccion" autoComplete="street-address" />
              <Campo etiqueta="A qué se dedica la empresa (opcional)" name="descripcion" como="textarea" rows={3} />
            </>
          )}
        </div>

        {error && <p className="error-formulario" role="alert">{error}</p>}
        <button type="submit" className="boton boton--primario boton--ancho" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="acceso-pie">¿Ya tienes cuenta? <Link to="/entrar">Inicia sesión</Link>.</p>
    </section>
  )
}
