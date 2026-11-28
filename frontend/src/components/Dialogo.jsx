import { useEffect, useRef } from 'react'

export default function Dialogo({ abierto, onCerrar, titulo, ancho = false, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      className={`dialogo${ancho === 'pdf' ? ' dialogo--pdf' : ancho ? ' dialogo--ancho' : ''}`}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      aria-labelledby="dialogo-titulo"
    >
      <div className="dialogo-cuerpo">
        <header className="dialogo-cabecera">
          <h2 id="dialogo-titulo">{titulo}</h2>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </header>
        {abierto && children}
      </div>
    </dialog>
  )
}
