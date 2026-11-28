import { Link } from 'react-router-dom'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Trayecto from '../../components/Trayecto.jsx'
import Equipo from '../../components/Equipo.jsx'
import { codigoEquipo, fecha, FUNCION_DOCENTE, periodo } from '../../formato.js'

export default function MisResidentes() {
  const estado = useDatos(['/api/reportes/por-revisar', '/api/residencias/docente'])

  return (
    <>
      <Encabezado titulo="Mis residentes">
        Revisa los reportes de los proyectos donde eres asesor o revisor.
      </Encabezado>
      <Bloque estado={estado}>
        {([porRevisar, residencias]) => (
          <>
            {porRevisar.length > 0 && (
              <section className="bloque-seccion" aria-labelledby="por-revisar-titulo">
                <h2 id="por-revisar-titulo" className="subtitulo">Por revisar ({porRevisar.length})</h2>
                <ul className="hoja lista-filas">
                  {porRevisar.map((r) => (
                    <li key={r.id} className="fila">
                      <span className="fila-cuerpo">
                        <strong>{r.cupo_equipo > 1 ? `Equipo ${codigoEquipo(r.vacante_id)}` : r.alumno}, reporte {r.numero_reporte}</strong>
                        <small>
                          {r.vacante}. {r.fecha_actualizacion ? `Corregido el ${fecha(r.fecha_actualizacion)}` : `Entregado el ${fecha(r.fecha_entrega)}`}
                          {r.cupo_equipo > 1 && r.alumno && ` por ${r.alumno}`}
                        </small>
                      </span>
                      <Link to={`/docente/residencias/${r.residencia_id}`} className="boton boton--primario">Revisar</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="residentes-titulo">
              <h2 id="residentes-titulo" className="subtitulo">Proyectos asignados</h2>
              {residencias.length === 0 ? (
                <Vacio titulo="Aún no tienes residentes asignados.">
                  <p>La coordinación te asigna como asesor o revisor en los proyectos. Aparecerán aquí cuando acepte alumnos en ellos.</p>
                </Vacio>
              ) : (
                <ul className="lista-expedientes">
                  {/* Un proyecto = un equipo: se muestra una tarjeta por equipo */}
                  {residencias.filter((r, i) => residencias.findIndex((o) => o.vacante_id === r.vacante_id) === i).map((r) => (
                    <li key={r.vacante_id} className="hoja expediente-fila">
                      <div className="expediente-fila-cabeza">
                        <div className="fila-cuerpo">
                          <strong>{r.vacante}</strong>
                          <small>{r.empresa}</small>
                          <Equipo vacanteId={r.vacante_id} integrantes={r.equipo} cupo={r.cupo_equipo} compacto />
                          <small>
                            Eres <span className={`funcion funcion--${r.mi_funcion}`}>{FUNCION_DOCENTE[r.mi_funcion]}</span>
                            {' '}{periodo(r.fecha_inicio, r.fecha_fin)}
                          </small>
                        </div>
                        <Link to={`/docente/residencias/${r.id}`} className="boton boton--secundario">
                          {r.reportes_pendientes > 0 ? `Ver reportes (${r.reportes_pendientes} por revisar)` : 'Ver reportes'}
                        </Link>
                      </div>
                      <Trayecto estado={r.estado} compacto />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </Bloque>
    </>
  )
}
