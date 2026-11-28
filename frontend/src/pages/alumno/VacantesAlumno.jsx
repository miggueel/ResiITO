import { useState } from 'react'
import { api } from '../../api.js'
import { useAuth } from '../../auth.jsx'
import { MAX_POSTULACIONES } from '../../formato.js'
import { useDatos } from '../../useDatos.js'
import ListaVacantes from '../../components/ListaVacantes.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import { useAvisos } from '../../components/Avisos.jsx'

export default function VacantesAlumno() {
  const avisar = useAvisos()
  const { actualizarUsuario } = useAuth()
  const mias = useDatos('/api/postulaciones/mis-postulaciones')
  const [enviando, setEnviando] = useState(null)

  const postulacionDe = (vacanteId) => mias.datos?.find((p) => p.vacante_id === vacanteId)
  const enRevision = mias.datos?.filter((p) => p.estado === 'pendiente').length ?? 0
  const restantes = Math.max(0, MAX_POSTULACIONES - enRevision)
  const limiteAlcanzado = restantes === 0

  async function postular(vacante) {
    setEnviando(vacante.id)
    try {
      await api('/api/postulaciones', { method: 'POST', body: { vacante_id: vacante.id } })
      avisar(`Te postulaste a ${vacante.titulo}.`)
      mias.recargar()
    } catch (err) {
      avisar(err.message, 'mal')
      // Si coordinación lo aceptó mientras tenía la página abierta
      if (err.status === 409 && /aceptado/.test(err.message)) actualizarUsuario({ en_residencia: true })
      mias.recargar()
    } finally {
      setEnviando(null)
    }
  }

  return (
    <>
      <Encabezado titulo="Vacantes">
        Abre una vacante para leer la descripción y los requisitos antes de postularte. La coordinación revisa cada postulación.
      </Encabezado>
      {mias.datos && (
        <p className={`limite${limiteAlcanzado ? ' limite--lleno' : ''}`} role="status">
          {limiteAlcanzado
            ? `Ya tienes ${MAX_POSTULACIONES} postulaciones en revisión, el máximo permitido. Podrás postularte a otro proyecto si coordinación rechaza alguna.`
            : `Puedes postularte a ${restantes} ${restantes === 1 ? 'proyecto más' : 'proyectos más'} (máximo ${MAX_POSTULACIONES} en revisión). Cuando te acepten en uno, las demás se retiran solas.`}
        </p>
      )}
      <ListaVacantes
        accion={(v) => {
          const p = postulacionDe(v.id)
          if (p) return <Estado valor={p.estado} etiqueta={p.estado === 'pendiente' ? 'Postulación enviada' : undefined} />
          if (v.aceptados >= v.cupo) return <Estado valor="cerrada" etiqueta="Sin lugares" />
          return (
            <button
              type="button"
              className="boton boton--primario"
              title={limiteAlcanzado ? `Máximo ${MAX_POSTULACIONES} postulaciones en revisión` : undefined}
              disabled={enviando === v.id || mias.cargando || limiteAlcanzado}
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
