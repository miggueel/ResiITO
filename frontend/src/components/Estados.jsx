// Estados de carga, error y vacío reutilizables
export function Cargando({ texto = 'Cargando…' }) {
  return <p className="cargando" aria-busy="true">{texto}</p>
}

export function ErrorCarga({ error, onReintentar }) {
  return (
    <div className="error-carga" role="alert">
      <p>{error?.message ?? 'No se pudo cargar la información.'}</p>
      {onReintentar && (
        <button type="button" className="boton boton--secundario" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function Vacio({ titulo, children }) {
  return (
    <div className="vacio">
      <p className="vacio-titulo">{titulo}</p>
      {children}
    </div>
  )
}

export function Bloque({ estado, children }) {
  if (estado.cargando && !estado.datos) return <Cargando />
  if (estado.error) return <ErrorCarga error={estado.error} onReintentar={estado.recargar} />
  return children(estado.datos)
}
