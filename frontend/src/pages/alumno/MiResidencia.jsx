import { Link } from 'react-router-dom'
import { useDatos } from '../../useDatos.js'
import { Bloque } from '../../components/Estados.jsx'
import Trayecto from '../../components/Trayecto.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import { fecha, periodo } from '../../formato.js'

const SIGUIENTE = {
  aceptado: 'Coordinación revisará tu postulación aceptada para asignarte asesor y fechas.',
  aprobada: 'Coordinación aprobó tu residencia. Podrás subir reportes en cuanto la marque como en proceso.',
  en_proceso: 'Entrega un reporte en PDF cada mes. Para finalizar, todos tus reportes deben estar aprobados.',
  finalizada: 'Tu empresa registrará tu evaluación y después coordinación liberará tu residencia.',
  liberada: 'Concluiste tu residencia profesional.',
}

export default function MiResidencia() {
  const estado = useDatos([
    '/api/residencias/mis-residencias',
    '/api/postulaciones/mis-postulaciones',
    '/api/evaluaciones/mis-evaluaciones',
    '/api/reportes/mis-reportes',
  ])

  return (
    <Bloque estado={estado}>
      {([residencias, postulaciones, evaluaciones, reportes]) => {
        const residencia = residencias[0]
        const aceptada = postulaciones.find((p) => p.estado === 'aceptado')

        if (!residencia && !aceptada) {
          const pendientes = postulaciones.filter((p) => p.estado === 'pendiente').length
          return (
            <>
              <Encabezado titulo="Mi residencia" />
              <div className="hoja hoja--invitacion">
                <h2>Aún no tienes una residencia en curso</h2>
                <p>
                  {pendientes > 0
                    ? `Tienes ${pendientes} ${pendientes === 1 ? 'postulación en revisión' : 'postulaciones en revisión'}. Cuando una empresa te acepte, tu trayecto empezará aquí.`
                    : 'Postúlate a una vacante. Cuando una empresa te acepte, aquí verás cada etapa hasta tu liberación.'}
                </p>
                <div className="acciones">
                  <Link to="/alumno/vacantes" className="boton boton--primario">Explorar vacantes</Link>
                  {pendientes > 0 && <Link to="/alumno/postulaciones" className="boton boton--secundario">Ver mis postulaciones</Link>}
                </div>
              </div>
            </>
          )
        }

        const etapa = residencia?.estado ?? 'aceptado'
        const evaluacion = residencia && evaluaciones.find((e) => e.residencia_id === residencia.id)
        const suyos = residencia ? reportes.filter((r) => r.residencia_id === residencia.id) : []
        const aprobados = suyos.filter((r) => r.estado === 'aprobado').length

        return (
          <>
            <Encabezado titulo={residencia?.vacante ?? aceptada.titulo}>
              {residencia?.empresa ?? aceptada.empresa}
            </Encabezado>

            <section className="hoja expediente" aria-label="Estado de tu residencia">
              <Trayecto estado={etapa} />
              <p className="expediente-siguiente">{SIGUIENTE[etapa]}</p>
            </section>

            {residencia && (
              <dl className="datos">
                <div><dt>Asesor interno</dt><dd>{residencia.asesor}</dd></div>
                <div><dt>Periodo</dt><dd>{periodo(residencia.fecha_inicio, residencia.fecha_fin)}</dd></div>
                <div>
                  <dt>Reportes aprobados</dt>
                  <dd>
                    {aprobados} de {suyos.length}
                    {residencia.estado === 'en_proceso' && (
                      <> <Link to="/alumno/reportes" className="enlace">Subir reporte</Link></>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Evaluación de la empresa</dt>
                  <dd>
                    {evaluacion ? (
                      <><span className="calificacion">{Number(evaluacion.calificacion)}</span> de 100</>
                    ) : 'Sin registrar'}
                  </dd>
                </div>
              </dl>
            )}

            {evaluacion?.observaciones && (
              <blockquote className="observacion">
                <p>{evaluacion.observaciones}</p>
                <footer>Observaciones de la empresa, {fecha(evaluacion.fecha_evaluacion)}</footer>
              </blockquote>
            )}
          </>
        )
      }}
    </Bloque>
  )
}
