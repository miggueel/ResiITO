import { Link } from 'react-router-dom'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import { fecha } from '../../formato.js'

export default function MisPostulaciones() {
  const estado = useDatos('/api/postulaciones/mis-postulaciones')
  return (
    <>
      <Encabezado titulo="Mis postulaciones">Cada empresa acepta o rechaza tu postulación.</Encabezado>
      <Bloque estado={estado}>
        {(lista) =>
          lista.length === 0 ? (
            <Vacio titulo="No te has postulado a ninguna vacante.">
              <Link to="/alumno/vacantes" className="boton boton--primario">Explorar vacantes</Link>
            </Vacio>
          ) : (
            <div className="tabla-envoltura hoja">
              <table className="tabla">
                <thead>
                  <tr><th>Vacante</th><th>Empresa</th><th>Fecha</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id}>
                      <td className="celda-principal">{p.titulo}</td>
                      <td>{p.empresa}</td>
                      <td className="numero">{fecha(p.fecha_postulacion)}</td>
                      <td><Estado valor={p.estado} /></td>
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
