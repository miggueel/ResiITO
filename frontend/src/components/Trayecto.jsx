// El trayecto de una residencia: cada etapa alcanzada queda "sellada".
export const ETAPAS = [
  { clave: 'aceptado', titulo: 'Aceptado', detalle: 'La empresa acepta la postulación' },
  { clave: 'aprobada', titulo: 'Aprobada', detalle: 'Coordinación asigna asesor y fechas' },
  { clave: 'en_proceso', titulo: 'En proceso', detalle: 'Se entregan reportes mensuales' },
  { clave: 'finalizada', titulo: 'Finalizada', detalle: 'Reportes aprobados, falta evaluación' },
  { clave: 'liberada', titulo: 'Liberada', detalle: 'Residencia concluida' },
]

const GIROS = [-7, 4, -3, 6, -5]

export function indiceEtapa(estado) {
  const i = ETAPAS.findIndex((e) => e.clave === estado)
  return i === -1 ? 0 : i
}

function Palomita() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Trayecto({ estado, compacto = false, animado = false }) {
  // Cada etapa alcanzada queda sellada; la siguiente se marca como próxima
  const actual = indiceEtapa(estado)

  return (
    <ol
      className={`trayecto${compacto ? ' trayecto--compacto' : ''}${animado ? ' trayecto--animado' : ''}`}
      aria-label={`Trayecto de residencia: ${ETAPAS[actual].titulo}`}
    >
      {ETAPAS.map((etapa, i) => {
        const tipo = i <= actual ? 'sellada' : i === actual + 1 ? 'proxima' : 'pendiente'
        return (
          <li
            key={etapa.clave}
            className={`etapa etapa--${tipo}`}
            style={{ '--giro': `${GIROS[i]}deg`, '--i': i }}
            aria-current={i === actual ? 'step' : undefined}
          >
            <span className="sello">{tipo === 'sellada' ? <Palomita /> : i + 1}</span>
            <span className="etapa-texto">
              <strong>{etapa.titulo}</strong>
              {!compacto && <small>{etapa.detalle}</small>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
