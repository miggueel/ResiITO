import { useState } from 'react'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import ListaVacantes from '../../components/ListaVacantes.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import { useAvisos } from '../../components/Avisos.jsx'

export default function VacantesAlumno() {
  const avisar = useAvisos()
  const mias = useDatos('/api/postulaciones/mis-postulaciones')
  const [enviando, setEnviando] = useState(null)

  const postulacionDe = (vacanteId) => mias.datos?.find((p) => p.vacante_id === vacanteId)

  async function postular(vacante) {
    setEnviando(vacante.id)
    try {
      await api('/api/postulaciones', { method: 'POST', body: { vacante_id: vacante.id } })
      avisar(`Te postulaste a ${vacante.titulo}.`)
      mias.recargar()
    } catch (err) {
      avisar(err.message, 'mal')
    } finally {
      setEnviando(null)
    }
  }

  return (
    <>
      <Encabezado titulo="Vacantes">
        Abre una vacante para leer la descripción y los requisitos antes de postularte.
      </Encabezado>
      <ListaVacantes
        accion={(v) => {
          const p = postulacionDe(v.id)
          if (p) return <Estado valor={p.estado} etiqueta={p.estado === 'pendiente' ? 'Postulación enviada' : undefined} />
          return (
            <button
              type="button"
              className="boton boton--primario"
              disabled={enviando === v.id || mias.cargando}
              onClick={() => postular(v)}
            >
              {enviando === v.id ? 'Postulando…' : 'Postularme'}
            </button>
          )
        }}
      />
    </>
  )
}
