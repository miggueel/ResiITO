import { useState } from 'react'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Campo from '../../components/Campo.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'

function FormularioAprobacion({ pendiente, onAprobada }) {
  const avisar = useAvisos()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    if (f.fecha_inicio > f.fecha_fin) return setError('La fecha de término debe ser posterior a la de inicio.')
    setEnviando(true)
    setError(null)
    try {
      await api('/api/residencias', {
        method: 'POST',
        body: {
          postulacion_id: pendiente.postulacion_id,
          asesor: f.asesor,
          fecha_inicio: f.fecha_inicio,
          fecha_fin: f.fecha_fin,
        },
      })
      avisar(`Residencia de ${pendiente.alumno} aprobada.`)
      onAprobada()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <p className="nota">{pendiente.alumno} en {pendiente.empresa}, {pendiente.vacante}</p>
      <Campo etiqueta="Asesor interno" name="asesor" required autoFocus placeholder="Nombre del docente asesor" />
      <div className="rejilla-campos">
        <Campo etiqueta="Inicio" name="fecha_inicio" type="date" required />
        <Campo etiqueta="Término" name="fecha_fin" type="date" required />
      </div>
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <button type="submit" className="boton boton--primario" disabled={enviando}>
        {enviando ? 'Aprobando…' : 'Aprobar residencia'}
      </button>
    </form>
  )
}

export default function PorAprobar() {
  const estado = useDatos('/api/residencias/pendientes')
  const [elegida, setElegida] = useState(null)

  return (
    <>
      <Encabezado titulo="Por aprobar">
        Postulaciones que la empresa ya aceptó. Asigna asesor y periodo para abrir la residencia.
      </Encabezado>
      <Bloque estado={estado}>
        {(lista) =>
          lista.length === 0 ? (
            <Vacio titulo="No hay residencias por aprobar.">
              <p>Cuando una empresa acepte a un alumno, la solicitud aparecerá aquí.</p>
            </Vacio>
          ) : (
            <ul className="hoja lista-filas">
              {lista.map((p) => (
                <li key={p.postulacion_id} className="fila">
                  <span className="fila-cuerpo">
                    <strong>{p.alumno}</strong>
                    <small>Número de control {p.matricula}</small>
                  </span>
                  <span className="fila-cuerpo">
                    <span>{p.vacante}</span>
                    <small>{p.empresa}</small>
                  </span>
                  <button type="button" className="boton boton--primario" onClick={() => setElegida(p)}>
                    Aprobar residencia
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </Bloque>
      <Dialogo abierto={Boolean(elegida)} onCerrar={() => setElegida(null)} titulo="Aprobar residencia">
        {elegida && (
          <FormularioAprobacion
            pendiente={elegida}
            onAprobada={() => {
              setElegida(null)
              estado.recargar()
            }}
          />
        )}
      </Dialogo>
    </>
  )
}
