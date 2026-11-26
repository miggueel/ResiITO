export default function Encabezado({ titulo, children, accion }) {
  return (
    <header className="encabezado">
      <div>
        <h1>{titulo}</h1>
        {children && <p>{children}</p>}
      </div>
      {accion}
    </header>
  )
}
