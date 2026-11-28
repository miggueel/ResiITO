import { useState } from 'react'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Trayecto from '../../components/Trayecto.jsx'
import Campo from '../../components/Campo.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import Docentes from '../../components/Docentes.jsx'
import Equipo from '../../components/Equipo.jsx'
import { periodo } from '../../formato.js'

function FormularioEvaluacion({ residencia, onGuardada }) {
  const avisar = useAvisos()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEnviando(true)
    setError(null)
    try {
      await api('/api/evaluaciones', {
        method: 'POST',
        body: {
          residencia_id: residencia.id,
          calificacion: Number(f.get('calificacion')),
          observaciones: f.get('observaciones').trim() || null,
        },
      })
      avisar(`Evaluación de ${residencia.alumno} registrada.`)
      onGuardada()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <p className="nota">{residencia.alumno}, {residencia.vacante}</p>
      <Campo etiqueta="Calificación" name="calificacion" type="number" min={0} max={100} step="0.1" required autoFocus ayuda="De 0 a 100. Solo puedes evaluar una vez." />
      <Campo etiqueta="Observaciones (opcional)" name="observaciones" como="textarea" rows={4} />
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <button type="submit" className="boton boton--primario" disabled={enviando}>
        {enviando ? 'Registrando…' : 'Registrar evaluación'}
      </button>
    </form>
  )
}

export default function Residentes() {
  const estado = useDatos('/api/residencias/empresa')
  const [evaluando, setEvaluando] = useState(null)

  return (
    <>
      <Encabezado titulo="Residentes">
        Evalúa a cada residente cuando su residencia esté en proceso o finalizada. Sin tu evaluación no se puede liberar.
      </Encabezado>
      <Bloque estado={estado}>
        {(lista) =>
          lista.length === 0 ? (
            <Vacio titulo="Aún no tienes residentes.">
              <p>Cuando la coordinación acepte alumnos en tus proyectos, aparecerán aquí.</p>
            </Vacio>
          ) : (
            <ul className="lista-expedientes">
              {lista.map((r) => (
                <li key={r.id} className="hoja expediente-fila">
                  <div className="expediente-fila-cabeza">
                    <div className="fila-cuerpo">
                      <strong>{r.alumno}</strong>
                      <small>{r.vacante}, {periodo(r.fecha_inicio, r.fecha_fin)}</small>
                      <Equipo vacanteId={r.vacante_id} integrantes={r.equipo} cupo={r.cupo_equipo} yo={r.id} compacto />
                      <Docentes lista={r.docentes} />
                    </div>
                    {r.evaluacion_id ? (
                      <span className="evaluada">Evaluado con <span className="calificacion">{Number(r.calificacion)}</span></span>
                    ) : ['en_proceso', 'finalizada'].includes(r.estado) ? (
                      <button type="button" className="boton boton--primario" onClick={() => setEvaluando(r)}>Evaluar residente</button>
                    ) : null}
                  </div>
                  <Trayecto estado={r.estado} compacto />
                </li>
              ))}
            </ul>
          )
        }
      </Bloque>
      <Dialogo abierto={Boolean(evaluando)} onCerrar={() => setEvaluando(null)} titulo="Evaluar residente">
        {evaluando && (
          <FormularioEvaluacion
            residencia={evaluando}
            onGuardada={() => {
              setEvaluando(null)
              estado.recargar()
            }}
          />
        )}
      </Dialogo>
    </>
  )
}
