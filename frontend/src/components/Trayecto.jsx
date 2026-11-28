// El trayecto de una residencia: cada etapa alcanzada queda "sellada".
const ETAPAS = [
  { clave: 'aceptado', titulo: 'Aceptado', detalle: 'Coordinación acepta al alumno en el proyecto' },
  { clave: 'en_proceso', titulo: 'En proceso', detalle: 'Reportes revisados por asesor y revisor' },
  { clave: 'finalizada', titulo: 'Finalizada', detalle: 'El docente aprueba el último reporte' },
  { clave: 'liberada', titulo: 'Liberada', detalle: 'Evaluada por la empresa y liberada' },
]

const NO_CONCLUIDA = { clave: 'no_concluida', titulo: 'No concluida', detalle: 'El proyecto se cerró sin concluir' }

const GIROS = [-7, 4, -3, 6]

// 'aprobada' (residencias anteriores) equivale a aceptada, aún sin iniciar
const INDICE = { aceptado: 0, aprobada: 0, en_proceso: 1, finalizada: 2, no_concluida: 2, liberada: 3 }

function Palomita() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Cruz() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export default function Trayecto({ estado, compacto = false, animado = false }) {
  const actual = INDICE[estado] ?? 0
  const fallida = estado === 'no_concluida'
  const etapas = fallida ? [...ETAPAS.slice(0, 2), NO_CONCLUIDA] : ETAPAS

  return (
    <ol
      className={`trayecto${compacto ? ' trayecto--compacto' : ''}${animado ? ' trayecto--animado' : ''}`}
      style={{ '--etapas': etapas.length }}
      aria-label={`Trayecto de residencia: ${etapas[actual].titulo}`}
    >
      {etapas.map((etapa, i) => {
        let tipo = i <= actual ? 'sellada' : i === actual + 1 ? 'proxima' : 'pendiente'
        if (fallida && i === actual) tipo = 'fallida'
        return (
          <li
            key={etapa.clave}
            className={`etapa etapa--${tipo}`}
            style={{ '--giro': `${GIROS[i]}deg`, '--i': i }}
            aria-current={i === actual ? 'step' : undefined}
          >
            <span className="sello">
              {tipo === 'sellada' ? <Palomita /> : tipo === 'fallida' ? <Cruz /> : i + 1}
            </span>
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
