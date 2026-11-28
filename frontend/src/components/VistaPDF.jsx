import { useEffect, useState } from 'react'
import { obtenerReporte } from '../api.js'
import Dialogo from './Dialogo.jsx'

// Vista previa de un reporte PDF dentro de la página, sin descargarlo.
// El PDF se pide con el token y se muestra desde una URL local (blob:).
export default function VistaPDF({ reporte, onCerrar }) {
  const [estado, setEstado] = useState({ url: null, error: null })
  const id = reporte?.id

  useEffect(() => {
    if (!id) return
    let vigente = true
    let url = null
    setEstado({ url: null, error: null })
    obtenerReporte(id)
      .then((u) => {
        url = u
        if (vigente) setEstado({ url: u, error: null })
        else URL.revokeObjectURL(u)
      })
      .catch((error) => vigente && setEstado({ url: null, error }))
    return () => {
      vigente = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [id])

  return (
    <Dialogo abierto={Boolean(reporte)} onCerrar={onCerrar} titulo={reporte ? `Reporte ${reporte.numero_reporte}` : ''} ancho="pdf">
      {reporte && (
        <div className="vista-pdf">
          {estado.error ? (
            <p className="error-formulario" role="alert">{estado.error.message}</p>
          ) : !estado.url ? (
            <p className="cargando">Cargando vista previa…</p>
          ) : (
            <>
              <iframe src={estado.url} title={`Vista previa del reporte ${reporte.numero_reporte}`} className="vista-pdf-marco" />
              <div className="acciones acciones--juntas">
                <a href={estado.url} download={`reporte-${reporte.numero_reporte}.pdf`} className="boton boton--secundario">Descargar</a>
                <a href={estado.url} target="_blank" rel="noopener" className="boton boton--tenue">Abrir en pestaña nueva</a>
              </div>
            </>
          )}
        </div>
      )}
    </Dialogo>
  )
}
