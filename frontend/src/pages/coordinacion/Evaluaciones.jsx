import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import { fecha } from '../../formato.js'

export default function Evaluaciones() {
  const estado = useDatos('/api/evaluaciones')
  return (
    <>
      <Encabezado titulo="Evaluaciones">Calificaciones que registran las empresas al cierre de cada residencia.</Encabezado>
      <Bloque estado={estado}>
        {(lista) =>
          lista.length === 0 ? (
            <Vacio titulo="Aún no hay evaluaciones registradas." />
          ) : (
            <div className="tabla-envoltura hoja">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Empresa</th>
                    <th className="numero">Calificación</th>
                    <th>Observaciones</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((e) => (
                    <tr key={e.id}>
                      <td className="celda-principal">
                        {e.alumno}
                        <small>{e.matricula}</small>
                      </td>
                      <td>{e.empresa}</td>
                      <td className="numero"><span className="calificacion">{Number(e.calificacion)}</span></td>
                      <td className="celda-texto">{e.observaciones || 'Sin observaciones'}</td>
                      <td className="numero">{fecha(e.fecha_evaluacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Bloque>
    </>
  )
}
