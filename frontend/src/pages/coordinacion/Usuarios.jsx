import { useState } from 'react'
import { api } from '../../api.js'
import { useAuth } from '../../auth.jsx'
import { useDatos } from '../../useDatos.js'
import { Bloque, Cargando, ErrorCarga, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import Campo from '../../components/Campo.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { CARRERAS, ESTADOS_REPUBLICA, fecha } from '../../formato.js'

const ROLES = [
  ['alumno', 'Alumno', 'Realiza su residencia'],
  ['empresa', 'Empresa', 'Propone proyectos'],
  ['docente', 'Docente', 'Asesora o revisa proyectos'],
]

const FILTROS_ROL = [
  ['todos', 'Todos'],
  ['alumno', 'Alumnos'],
  ['empresa', 'Empresas'],
  ['docente', 'Docentes'],
  ['coordinador', 'Coordinación'],
]

const FILTROS_CUENTA = [
  ['todas', 'Todas las cuentas'],
  ['activa', 'Activas'],
  ['pendiente', 'Sin activar'],
  ['inactiva', 'Desactivadas'],
]

const ROL_TEXTO = { alumno: 'Alumno', empresa: 'Empresa', docente: 'Docente', coordinador: 'Coordinación' }

const HISTORIAL = {
  postulaciones: ['postulación', 'postulaciones'],
  proyectos: ['proyecto', 'proyectos'],
  proyectos_asignados: ['proyecto asignado', 'proyectos asignados'],
  observaciones: ['observación', 'observaciones'],
  reportes_revisados: ['reporte revisado', 'reportes revisados'],
  solicitudes: ['solicitud', 'solicitudes'],
  usuarios_creados: ['usuario dado de alta', 'usuarios dados de alta'],
  solicitudes_resueltas: ['solicitud resuelta', 'solicitudes resueltas'],
}

function invitacionVencida(u) {
  return u.estado_cuenta === 'pendiente' && (!u.invitacion_vence || new Date(u.invitacion_vence) < new Date())
}

function EstadoCuenta({ usuario: u }) {
  if (u.estado_cuenta === 'inactiva') return <Estado valor="cerrada" etiqueta="Desactivada" />
  if (u.estado_cuenta === 'pendiente') {
    return invitacionVencida(u)
      ? <Estado valor="rechazado" etiqueta="Invitación vencida" />
      : <Estado valor="pendiente" etiqueta={`Sin activar, vence ${fecha(u.invitacion_vence)}`} />
  }
  if (u.restablecimiento_vence) return <Estado valor="pendiente" etiqueta="Restablecimiento enviado" />
  return <Estado valor="activa" etiqueta="Activa" />
}

function resumenPerfil(u) {
  if (u.rol === 'alumno') return `${u.matricula}, ${u.carrera}${u.semestre ? `, ${u.semestre}.º semestre` : ''}`
  if (u.rol === 'empresa') return `${u.empresa}, ${u.estado_republica ?? 'estado sin registrar'}`
  if (u.rol === 'docente') return [u.departamento, u.numero_empleado && `empleado ${u.numero_empleado}`].filter(Boolean).join(', ') || 'Docente'
  return 'Coordinación de residencias'
}

// Formulario para dar de alta (sin usuario) o editar (con usuario)
function FormularioUsuario({ usuario, onGuardado }) {
  const avisar = useAvisos()
  const editando = Boolean(usuario)
  const [rol, setRol] = useState(usuario?.rol ?? 'alumno')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const v = (campo) => usuario?.[campo] ?? ''

  async function enviar(e) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    const cuerpo = { nombre: f.nombre, correo: f.correo }
    if (rol === 'alumno') {
      Object.assign(cuerpo, {
        matricula: f.matricula,
        carrera: f.carrera,
        semestre: f.semestre ? Number.parseInt(f.semestre, 10) : null,
      })
    } else if (rol === 'empresa') {
      Object.assign(cuerpo, {
        nombre_empresa: f.nombre_empresa,
        estado_republica: f.estado_republica,
        telefono: f.telefono,
        direccion: f.direccion,
        descripcion: f.descripcion,
      })
    } else if (rol === 'docente') {
      Object.assign(cuerpo, { numero_empleado: f.numero_empleado, departamento: f.departamento })
    }

    setEnviando(true)
    setError(null)
    try {
      const r = editando
        ? await api(`/api/usuarios/${usuario.id}`, { method: 'PUT', body: cuerpo })
        : await api('/api/usuarios', { method: 'POST', body: { rol, ...cuerpo } })
      avisar(r.mensaje, r.correo_enviado === false ? 'mal' : 'bien')
      onGuardado()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      {editando ? (
        <p className="nota">Tipo de cuenta: <strong>{ROL_TEXTO[rol]}</strong>. No se puede cambiar; para otro tipo, da de alta una cuenta nueva.</p>
      ) : (
        <fieldset className="selector-rol selector-rol--tres">
          <legend>Tipo de cuenta</legend>
          {ROLES.map(([valor, titulo, detalle]) => (
            <label key={valor} className="opcion-rol">
              <input type="radio" name="rol" value={valor} checked={rol === valor} onChange={() => setRol(valor)} />
              <span>
                <strong>{titulo}</strong>
                <small>{detalle}</small>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="rejilla-campos">
        <Campo etiqueta={rol === 'empresa' ? 'Nombre del contacto' : 'Nombre completo'} name="nombre" defaultValue={v('nombre')} required autoFocus />
        <Campo
          etiqueta="Correo"
          name="correo"
          type="email"
          defaultValue={v('correo')}
          required
          ayuda={editando ? undefined : 'Aquí llegará el enlace para crear la contraseña.'}
        />

        {rol === 'alumno' && (
          <>
            <Campo etiqueta="Número de control" name="matricula" defaultValue={v('matricula')} required />
            <Campo etiqueta="Carrera" name="carrera" list="carreras-usuario" defaultValue={v('carrera')} required />
            <datalist id="carreras-usuario">
              {CARRERAS.map((c) => <option key={c} value={c} />)}
            </datalist>
            <Campo etiqueta="Semestre (opcional)" name="semestre" type="number" min={1} max={14} defaultValue={v('semestre')} />
          </>
        )}

        {rol === 'empresa' && (
          <>
            <Campo etiqueta="Nombre de la empresa" name="nombre_empresa" defaultValue={v('empresa')} required />
            <Campo etiqueta="Estado">
              {(id) => (
                <select id={id} name="estado_republica" required defaultValue={usuario?.estado_republica ?? (editando ? '' : 'Oaxaca')}>
                  <option value="" disabled>Elige el estado</option>
                  {ESTADOS_REPUBLICA.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              )}
            </Campo>
            <Campo etiqueta="Teléfono (opcional)" name="telefono" type="tel" defaultValue={v('telefono')} />
            <Campo etiqueta="Dirección (opcional)" name="direccion" defaultValue={v('direccion')} />
            <Campo etiqueta="A qué se dedica (opcional)" name="descripcion" como="textarea" rows={2} defaultValue={v('descripcion')} />
          </>
        )}

        {rol === 'docente' && (
          <>
            <Campo etiqueta="Número de empleado (opcional)" name="numero_empleado" defaultValue={v('numero_empleado')} />
            <Campo etiqueta="Departamento (opcional)" name="departamento" defaultValue={v('departamento')} />
          </>
        )}
      </div>

      {error && <p className="error-formulario" role="alert">{error}</p>}
      <button type="submit" className="boton boton--primario" disabled={enviando}>
        {editando
          ? (enviando ? 'Guardando…' : 'Guardar cambios')
          : (enviando ? 'Enviando invitación…' : 'Dar de alta y enviar invitación')}
      </button>
    </form>
  )
}

// Ficha del usuario: datos, historial y acciones
function FichaUsuario({ id, onCambio, onEditar, onEliminado }) {
  const avisar = useAvisos()
  const { usuario: yo } = useAuth()
  const detalle = useDatos(`/api/usuarios/${id}`)
  const [procesando, setProcesando] = useState(false)

  if (detalle.cargando && !detalle.datos) return <Cargando />
  if (detalle.error) return <ErrorCarga error={detalle.error} onReintentar={detalle.recargar} />

  const u = detalle.datos
  const esYo = u.id === yo.id
  const historial = Object.entries(u.historial ?? {}).filter(([, n]) => n > 0)

  async function ejecutar(promesa, despues) {
    setProcesando(true)
    try {
      const r = await promesa
      avisar(r.mensaje)
      despues?.()
      detalle.recargar()
      onCambio()
    } catch (err) {
      avisar(err.message, 'mal')
    } finally {
      setProcesando(false)
    }
  }

  const enlace = () => {
    const tipo = u.estado_cuenta === 'pendiente' ? 'invitacion' : 'restablecimiento'
    if (tipo === 'restablecimiento' && !window.confirm(
      `¿Enviar a ${u.correo} un enlace para restablecer su contraseña? Su contraseña actual seguirá funcionando hasta que use el enlace.`,
    )) return
    ejecutar(api(`/api/usuarios/${u.id}/${tipo}`, { method: 'POST' }))
  }

  const cambiarEstado = (activa) => {
    if (!activa && !window.confirm(`¿Desactivar la cuenta de ${u.nombre}? No podrá iniciar sesión y su sesión abierta se cerrará. Su historial se conserva.`)) return
    ejecutar(api(`/api/usuarios/${u.id}/estado`, { method: 'PATCH', body: { activa } }))
  }

  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar definitivamente la cuenta de ${u.nombre}? Esta acción no se puede deshacer.`)) return
    setProcesando(true)
    try {
      const r = await api(`/api/usuarios/${u.id}`, { method: 'DELETE' })
      avisar(r.mensaje)
      onEliminado()
    } catch (err) {
      setProcesando(false)
      if (err.status === 409 && u.estado_cuenta !== 'inactiva' &&
          window.confirm(`${err.message}\n\n¿Quieres desactivar la cuenta ahora?`)) {
        ejecutar(api(`/api/usuarios/${u.id}/estado`, { method: 'PATCH', body: { activa: false } }))
        return
      }
      avisar(err.message, 'mal')
    }
  }

  return (
    <div className="ficha">
      <div className="ficha-cabeza">
        <div className="fila-cuerpo">
          <strong>{u.nombre}</strong>
          <small>{ROL_TEXTO[u.rol]}{esYo && ' (tu cuenta)'}</small>
        </div>
        <EstadoCuenta usuario={u} />
      </div>

      <dl className="datos datos--ficha">
        <div><dt>Correo</dt><dd><a href={`mailto:${u.correo}`}>{u.correo}</a></dd></div>
        {u.rol === 'alumno' && (
          <>
            <div><dt>Número de control</dt><dd>{u.matricula}</dd></div>
            <div><dt>Carrera</dt><dd>{u.carrera}</dd></div>
            <div><dt>Semestre</dt><dd>{u.semestre ?? 'Sin registrar'}</dd></div>
          </>
        )}
        {u.rol === 'empresa' && (
          <>
            <div><dt>Empresa</dt><dd>{u.empresa}</dd></div>
            <div><dt>Estado</dt><dd>{u.estado_republica ?? 'Sin registrar'}</dd></div>
            <div><dt>Teléfono</dt><dd>{u.telefono ?? 'Sin registrar'}</dd></div>
            <div><dt>Dirección</dt><dd>{u.direccion ?? 'Sin registrar'}</dd></div>
          </>
        )}
        {u.rol === 'docente' && (
          <>
            <div><dt>Número de empleado</dt><dd>{u.numero_empleado ?? 'Sin registrar'}</dd></div>
            <div><dt>Departamento</dt><dd>{u.departamento ?? 'Sin registrar'}</dd></div>
          </>
        )}
        <div><dt>Alta</dt><dd>{fecha(u.fecha_registro)}</dd></div>
        {u.fecha_desactivacion && <div><dt>Desactivada</dt><dd>{fecha(u.fecha_desactivacion)}</dd></div>}
      </dl>

      {u.rol === 'empresa' && u.descripcion && <p className="nota">{u.descripcion}</p>}

      <section className="ficha-historial" aria-label="Historial">
        <h3>Historial</h3>
        {historial.length === 0 ? (
          <p className="nota">Sin actividad en residencias.</p>
        ) : (
          <ul className="lista-chips">
            {historial.map(([clave, n]) => (
              <li key={clave}>{n} {HISTORIAL[clave]?.[n === 1 ? 0 : 1] ?? clave}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="ficha-acciones">
        <button type="button" className="boton boton--primario" disabled={procesando} onClick={() => onEditar(u)}>Editar datos</button>
        {!esYo && u.estado_cuenta !== 'inactiva' && u.rol !== 'coordinador' && (
          <button type="button" className="boton boton--secundario" disabled={procesando} onClick={enlace}>
            {u.estado_cuenta === 'pendiente' ? 'Reenviar invitación' : 'Restablecer contraseña'}
          </button>
        )}
        {!esYo && (u.estado_cuenta === 'inactiva' ? (
          <button type="button" className="boton boton--secundario" disabled={procesando} onClick={() => cambiarEstado(true)}>Reactivar cuenta</button>
        ) : (
          <button type="button" className="boton boton--secundario" disabled={procesando} onClick={() => cambiarEstado(false)}>Desactivar cuenta</button>
        ))}
        {!esYo && (
          <button
            type="button"
            className="boton boton--tenue boton--peligro"
            disabled={procesando}
            title={u.puede_eliminarse ? undefined : 'Tiene historial: solo se puede desactivar'}
            onClick={eliminar}
          >
            Eliminar
          </button>
        )}
      </div>
      {!esYo && !u.puede_eliminarse && (
        <p className="nota">Como tiene historial en residencias, solo puede desactivarse; así se conservan sus registros.</p>
      )}
    </div>
  )
}

export default function Usuarios() {
  const estado = useDatos('/api/usuarios')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [filtroCuenta, setFiltroCuenta] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [alta, setAlta] = useState(false)
  const [fichaId, setFichaId] = useState(null)
  const [editando, setEditando] = useState(null)

  return (
    <>
      <Encabezado
        titulo="Usuarios"
        accion={<button type="button" className="boton boton--primario" onClick={() => setAlta(true)}>Dar de alta usuario</button>}
      >
        Da de alta, consulta, edita, desactiva o elimina cuentas. Cada alta recibe un enlace por correo para crear su contraseña (vence en 48 horas).
      </Encabezado>

      <Bloque estado={estado}>
        {(todos) => {
          const texto = busqueda.trim().toLowerCase()
          const lista = todos.filter((u) =>
            (filtroRol === 'todos' || u.rol === filtroRol) &&
            (filtroCuenta === 'todas' || u.estado_cuenta === filtroCuenta) &&
            (!texto || [u.nombre, u.correo, u.matricula, u.empresa, u.numero_empleado].some((c) => c?.toLowerCase().includes(texto))),
          )
          return (
            <>
              <div className="barra-filtros">
                <div className="pestanas" role="group" aria-label="Filtrar por tipo">
                  {FILTROS_ROL.map(([valor, txt]) => (
                    <button key={valor} type="button" aria-pressed={filtroRol === valor} onClick={() => setFiltroRol(valor)}>
                      {txt} ({valor === 'todos' ? todos.length : todos.filter((u) => u.rol === valor).length})
                    </button>
                  ))}
                </div>
                <div className="filtros-derecha">
                  <select aria-label="Filtrar por estado de la cuenta" value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)}>
                    {FILTROS_CUENTA.map(([valor, txt]) => <option key={valor} value={valor}>{txt}</option>)}
                  </select>
                  <input
                    type="search"
                    className="buscador"
                    placeholder="Buscar por nombre, correo o número"
                    aria-label="Buscar usuarios"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              {lista.length === 0 ? (
                <Vacio titulo="No hay usuarios con ese filtro." />
              ) : (
                <ul className="hoja lista-filas">
                  {lista.map((u) => (
                    <li key={u.id} className={`fila${u.estado_cuenta === 'inactiva' ? ' fila--apagada' : ''}`}>
                      <span className="fila-cuerpo">
                        <strong>{u.nombre}</strong>
                        <small>{ROL_TEXTO[u.rol]}. {resumenPerfil(u)}</small>
                        <small>{u.correo}</small>
                      </span>
                      <EstadoCuenta usuario={u} />
                      <button type="button" className="boton boton--secundario" onClick={() => setFichaId(u.id)}>
                        Ver ficha
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        }}
      </Bloque>

      <Dialogo abierto={alta} onCerrar={() => setAlta(false)} titulo="Dar de alta usuario" ancho>
        <FormularioUsuario onGuardado={() => { setAlta(false); estado.recargar() }} />
      </Dialogo>

      <Dialogo abierto={Boolean(fichaId) && !editando} onCerrar={() => setFichaId(null)} titulo="Ficha del usuario" ancho>
        {fichaId && !editando && (
          <FichaUsuario
            key={fichaId}
            id={fichaId}
            onCambio={estado.recargar}
            onEditar={(u) => setEditando(u)}
            onEliminado={() => { setFichaId(null); estado.recargar() }}
          />
        )}
      </Dialogo>

      <Dialogo abierto={Boolean(editando)} onCerrar={() => setEditando(null)} titulo="Editar usuario" ancho>
        {editando && (
          <FormularioUsuario
            key={editando.id}
            usuario={editando}
            onGuardado={() => { setEditando(null); estado.recargar() }}
          />
        )}
      </Dialogo>
    </>
  )
}
