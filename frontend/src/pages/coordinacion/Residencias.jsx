import { useState } from 'react'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Trayecto from '../../components/Trayecto.jsx'
import Docentes from '../../components/Docentes.jsx'
import Equipo from '../../components/Equipo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { periodo } from '../../formato.js'

// Coordinación solo inicia residencias anteriores aprobadas y libera las finalizadas.
// Finalizada / no concluida las decide el docente con el último reporte.
const AVANCE = {
  aprobada: { estado: 'en_proceso', texto: 'Iniciar residencia', hecho: 'iniciada' },
  finalizada: { estado: 'liberada', texto: 'Liberar residencia', hecho: 'liberada' },
}

const FILTROS = [
  ['todas', 'Todas'],
  ['en_proceso', 'En proceso'],
  ['finalizada', 'Finalizadas'],
  ['no_concluida', 'No concluidas'],
  ['liberada', 'Liberadas'],
]

export default function Residencias() {
  const avisar = useAvisos()
  const estado = useDatos('/api/residencias')
  const [filtro, setFiltro] = useState('todas')
  const [procesando, setProcesando] = useState(null)

  async function avanzar(r) {
    const paso = AVANCE[r.estado]
    if (paso.estado === 'liberada' && !window.confirm(`¿Liberar la residencia de ${r.alumno}? Es la etapa final.`)) return
    setProcesando(r.id)
    try {
      await api(`/api/residencias/${r.id}/estado`, { method: 'PATCH', body: { estado: paso.estado } })
      avisar(`Residencia de ${r.alumno} ${paso.hecho}.`)
      estado.recargar()
    } catch (err) {
      avisar(err.message, 'mal')
    } finally {
      setProcesando(null)
    }
  }

  return (
    <>
      <Encabezado titulo="Residencias">
        El docente cierra cada proyecto como finalizado o no concluido. Coordinación libera las finalizadas cuando la empresa ya evaluó.
      </Encabezado>
      <Bloque estado={estado}>
        {(todas) => {
          const lista = filtro === 'todas' ? todas : todas.filter((r) => r.estado === filtro)
          return (
            <>
              <div className="pestanas" role="group" aria-label="Filtrar por etapa">
                {FILTROS.map(([valor, texto]) => (
                  <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
                    {texto} ({valor === 'todas' ? todas.length : todas.filter((r) => r.estado === valor).length})
                  </button>
                ))}
              </div>
              {lista.length === 0 ? (
                <Vacio titulo="No hay residencias en esta etapa." />
              ) : (
                <ul className="lista-expedientes">
                  {lista.map((r) => {
                    const paso = AVANCE[r.estado]
                    return (
                      <li key={r.id} className="hoja expediente-fila">
                        <div className="expediente-fila-cabeza">
                          <div className="fila-cuerpo">
                            <strong>{r.alumno}</strong>
                            <small>{r.matricula}, {r.vacante} en {r.empresa}</small>
                            <Equipo vacanteId={r.vacante_id} integrantes={r.equipo} cupo={r.cupo_equipo} yo={r.id} compacto />
                            <small>
                              {periodo(r.fecha_inicio, r.fecha_fin)}. Reportes del equipo con visto bueno: {r.reportes_aprobados} de {r.total_reportes}.
                              {r.evaluacion_id ? ` Evaluación de la empresa: ${Number(r.calificacion)}.` : ' Sin evaluación de la empresa.'}
                            </small>
                            <Docentes lista={r.docentes} />
                            {r.solicitud_pendiente_id && <small className="alerta-texto">Hay una solicitud de cambio de estatus pendiente.</small>}
                          </div>
                          {paso && (
                            <button
                              type="button"
                              className={`boton ${paso.estado === 'liberada' ? 'boton--primario' : 'boton--secundario'}`}
                              disabled={procesando === r.id || (paso.estado === 'liberada' && !r.evaluacion_id)}
                              title={paso.estado === 'liberada' && !r.evaluacion_id ? 'La empresa aún no evalúa al residente' : undefined}
                              onClick={() => avanzar(r)}
                            >
                              {paso.texto}
                            </button>
                          )}
                        </div>
                        <Trayecto estado={r.estado} compacto />
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )
        }}
      </Bloque>
    </>
  )
}
