import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth.jsx'
import { useDatos } from '../../useDatos.js'
import { Bloque } from '../../components/Estados.jsx'
import Trayecto from '../../components/Trayecto.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Equipo from '../../components/Equipo.jsx'
import { faltanDocentes, fecha, FUNCION_DOCENTE, periodo } from '../../formato.js'

const SIGUIENTE = {
  aprobada: 'Tu residencia está aprobada. Podrás entregar reportes cuando coordinación la inicie.',
  en_proceso: 'Entrega tus reportes en PDF. Tu asesor y tu revisor te darán visto bueno o te pedirán correcciones.',
  finalizada: 'Tu docente aprobó tu último reporte. Falta la evaluación de la empresa para que coordinación libere tu residencia.',
  no_concluida: 'Tu docente cerró el proyecto como no concluido. Acude a la coordinación de residencias para saber cómo continuar.',
  liberada: 'Concluiste tu residencia profesional.',
}

export default function MiResidencia() {
  const estado = useDatos([
    '/api/residencias/mis-residencias',
    '/api/postulaciones/mis-postulaciones',
    '/api/evaluaciones/mis-evaluaciones',
  ])
  const { usuario, actualizarUsuario } = useAuth()
  const tieneResidencia = Boolean(estado.datos?.[0]?.length)

  // Mantiene el menú al día: con residencia ya no se muestran vacantes ni postulaciones
  useEffect(() => {
    if (estado.datos && Boolean(usuario?.en_residencia) !== tieneResidencia) {
      actualizarUsuario({ en_residencia: tieneResidencia })
    }
  }, [estado.datos, tieneResidencia, usuario?.en_residencia, actualizarUsuario])

  return (
    <Bloque estado={estado}>
      {([residencias, postulaciones, evaluaciones]) => {
        const residencia = residencias[0]

        if (!residencia) {
          const pendientes = postulaciones.filter((p) => p.estado === 'pendiente').length
          return (
            <>
              <Encabezado titulo="Mi residencia" />
              <div className="hoja hoja--invitacion">
                <h2>Aún no tienes una residencia en curso</h2>
                <p>
                  {pendientes > 0
                    ? `Tienes ${pendientes} ${pendientes === 1 ? 'postulación en revisión' : 'postulaciones en revisión'}. Cuando la coordinación te acepte en un proyecto, tu trayecto empezará aquí.`
                    : 'Postúlate a un proyecto. Cuando la coordinación te acepte, aquí verás a tu asesor, a tu revisor y cada etapa hasta tu liberación.'}
                </p>
                <div className="acciones">
                  <Link to="/alumno/vacantes" className="boton boton--primario">Explorar vacantes</Link>
                  {pendientes > 0 && <Link to="/alumno/postulaciones" className="boton boton--secundario">Ver mis postulaciones</Link>}
                </div>
              </div>
            </>
          )
        }

        const evaluacion = evaluaciones.find((e) => e.residencia_id === residencia.id)

        return (
          <>
            <Encabezado titulo={residencia.vacante}>{residencia.empresa}</Encabezado>

            <section className="hoja expediente" aria-label="Estado de tu residencia">
              <Trayecto estado={residencia.estado} />
              <p className="expediente-siguiente">
                {residencia.estado === 'en_proceso' && faltanDocentes(residencia.docentes).length > 0
                  ? `Tu residencia está en proceso. Podrás entregar reportes cuando coordinación asigne a tu ${faltanDocentes(residencia.docentes).join(' y ')}.`
                  : SIGUIENTE[residencia.estado]}
              </p>
            </section>

            <dl className="datos">
              <div>
                <dt>Tu equipo</dt>
                <dd><Equipo vacanteId={residencia.vacante_id} integrantes={residencia.equipo} cupo={residencia.cupo_equipo} yo={residencia.id} /></dd>
              </div>
              <div>
                <dt>Tus docentes</dt>
                <dd>
                  {residencia.docentes.length === 0 ? 'Por asignar. Coordinación los asigna cuando el proyecto tiene a todos sus alumnos.' : (
                    <ul className="docentes">
                      {residencia.docentes.map((d) => (
                        <li key={d.docente_id}>
                          <span className={`funcion funcion--${d.funcion}`}>{FUNCION_DOCENTE[d.funcion]}</span>
                          <a href={`mailto:${d.correo}`}>{d.nombre}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              <div><dt>Periodo</dt><dd>{periodo(residencia.fecha_inicio, residencia.fecha_fin)}</dd></div>
              <div>
                <dt>Reportes del equipo con visto bueno</dt>
                <dd>
                  {residencia.reportes_aprobados} de {residencia.total_reportes}
                  {residencia.estado === 'en_proceso' && faltanDocentes(residencia.docentes).length === 0 && (
                    <> <Link to="/alumno/reportes" className="enlace">Entregar reporte</Link></>
                  )}
                </dd>
              </div>
              <div>
                <dt>Evaluación de la empresa</dt>
                <dd>
                  {evaluacion ? <><span className="calificacion">{Number(evaluacion.calificacion)}</span> de 100</> : 'Sin registrar'}
                </dd>
              </div>
            </dl>

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
