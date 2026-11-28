import { useState } from 'react'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import Campo from '../../components/Campo.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import Docentes from '../../components/Docentes.jsx'
import { CARRERAS } from '../../formato.js'

function FormularioVacante({ vacante, onGuardada }) {
  const avisar = useAvisos()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const editando = Boolean(vacante)
  const aprobada = ['activa', 'cerrada'].includes(vacante?.estado)

  async function enviar(e) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    const cuerpo = {
      titulo: f.titulo,
      descripcion: f.descripcion.trim() || null,
      carrera: f.carrera.trim() || null,
      requisitos: f.requisitos.trim() || null,
      ...(aprobada && { estado: f.estado }),
    }
    setEnviando(true)
    setError(null)
    try {
      await api(editando ? `/api/vacantes/${vacante.id}` : '/api/vacantes', {
        method: editando ? 'PUT' : 'POST',
        body: cuerpo,
      })
      avisar(editando ? (aprobada ? 'Cambios guardados.' : 'Proyecto enviado a coordinación.') : 'Proyecto enviado a coordinación para su aprobación.')
      onGuardada()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <Campo etiqueta="Título del puesto" name="titulo" defaultValue={vacante?.titulo} required autoFocus />
      <Campo etiqueta="Carrera" name="carrera" list="carreras-vacante" defaultValue={vacante?.carrera ?? ''} />
      <datalist id="carreras-vacante">
        {CARRERAS.map((c) => <option key={c} value={c} />)}
      </datalist>
      <Campo etiqueta="Descripción" name="descripcion" como="textarea" rows={4} defaultValue={vacante?.descripcion ?? ''} />
      <Campo etiqueta="Requisitos" name="requisitos" como="textarea" rows={3} defaultValue={vacante?.requisitos ?? ''} />
      {vacante?.estado === 'rechazada' && (
        <p className="error-formulario">Motivo del rechazo: {vacante.motivo_rechazo}</p>
      )}
      {aprobada && (
        <Campo etiqueta="Estado">
          {(id) => (
            <select id={id} name="estado" defaultValue={vacante.estado}>
              <option value="activa">Activa, recibe postulaciones</option>
              <option value="cerrada">Cerrada, oculta para alumnos</option>
            </select>
          )}
        </Campo>
      )}
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <button type="submit" className="boton boton--primario" disabled={enviando}>
        {enviando ? 'Enviando…' : aprobada ? 'Guardar cambios' : 'Enviar a coordinación'}
      </button>
    </form>
  )
}

export default function MisVacantes() {
  const avisar = useAvisos()
  const estado = useDatos('/api/vacantes/mias')
  const [dialogo, setDialogo] = useState(null) // { vacante } | { nueva: true }

  async function eliminar(v) {
    if (!window.confirm(`¿Eliminar la vacante "${v.titulo}"? Esta acción no se puede deshacer.`)) return
    try {
      await api(`/api/vacantes/${v.id}`, { method: 'DELETE' })
      avisar('Vacante eliminada.')
      estado.recargar()
    } catch (err) {
      avisar(
        err.status === 409 ? 'Esta vacante ya tiene postulaciones. Ciérrala en lugar de eliminarla.' : err.message,
        'mal',
      )
    }
  }

  const cerrar = () => setDialogo(null)

  return (
    <>
      <Encabezado
        titulo="Mis proyectos"
        accion={<button type="button" className="boton boton--primario" onClick={() => setDialogo({ nueva: true })}>Proponer proyecto</button>}
      >
        La coordinación revisa cada proyecto, define cuántos alumnos puede recibir y le asigna asesor y revisor. Al aprobarlo, los alumnos lo ven y se postulan.
      </Encabezado>

      <Bloque estado={estado}>
        {(vacantes) =>
          vacantes.length === 0 ? (
            <Vacio titulo="Aún no propones proyectos.">
              <p>Propón el primero para que la coordinación lo revise y lo publique para los alumnos.</p>
            </Vacio>
          ) : (
            <ul className="hoja lista-filas">
              {vacantes.map((v) => (
                <li key={v.id} className="fila">
                  <span className="fila-cuerpo">
                    <strong>{v.titulo}</strong>
                    <small>
                      {v.carrera || 'Cualquier carrera'}
                      {v.cupo != null && `. Cupo: ${v.aceptados} de ${v.cupo}`}
                      {'. '}
                      {v.total_postulaciones === 1 ? '1 postulación' : `${v.total_postulaciones} postulaciones`}
                    </small>
                    {v.estado === 'rechazada' && <small className="alerta-texto">Motivo: {v.motivo_rechazo}. Corrígelo y vuelve a enviarlo.</small>}
                    {['activa', 'cerrada'].includes(v.estado) && <Docentes lista={v.docentes} vacio="Coordinación aún no asigna docentes" />}
                  </span>
                  <Estado valor={v.estado} etiqueta={v.estado === 'pendiente' ? 'En revisión' : undefined} />
                  <span className="fila-acciones">
                    <button type="button" className="boton boton--tenue" onClick={() => setDialogo({ vacante: v })}>{v.estado === 'rechazada' ? 'Corregir' : 'Editar'}</button>
                    <button type="button" className="boton boton--tenue boton--peligro" onClick={() => eliminar(v)}>Eliminar</button>
                  </span>
                </li>
              ))}
            </ul>
          )
        }
      </Bloque>

      <Dialogo abierto={Boolean(dialogo)} onCerrar={cerrar} titulo={dialogo?.vacante ? 'Editar proyecto' : 'Proponer proyecto'}>
        <FormularioVacante
          key={dialogo?.vacante?.id ?? 'nueva'}
          vacante={dialogo?.vacante}
          onGuardada={() => {
            cerrar()
            estado.recargar()
          }}
        />
      </Dialogo>
    </>
  )
}
