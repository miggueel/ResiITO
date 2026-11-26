import { Link } from 'react-router-dom'

export default function NoEncontrada() {
  return (
    <section className="acceso">
      <h1>Esta página no existe</h1>
      <p>Revisa la dirección o vuelve al inicio para consultar las vacantes abiertas.</p>
      <p><Link to="/" className="boton boton--secundario">Ir al inicio</Link></p>
    </section>
  )
}
