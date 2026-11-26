import { useId } from 'react'

export default function Campo({ etiqueta, ayuda, como = 'input', children, ...props }) {
  const id = useId()
  const ayudaId = ayuda ? `${id}-ayuda` : undefined
  const Control = como
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children ? children(id) : <Control id={id} aria-describedby={ayudaId} {...props} />}
      {ayuda && <small id={ayudaId}>{ayuda}</small>}
    </div>
  )
}
