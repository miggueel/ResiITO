import { useState } from 'react'
import { useDatos } from '../useDatos.js'
import { Bloque, Vacio } from './Estados.jsx'
import Estado from './Estado.jsx'
import { CARRERAS, fecha, lugares } from '../formato.js'

// Bolsa de vacantes activas con filtro por carrera.
// `accion(vacante)` devuelve el control a la derecha de cada vacante.
export default function ListaVacantes({ accion }) {
  const [carrera, setCarrera] = useState('')
  const [filtro, setFiltro] = useState('')
  const consulta = new URLSearchParams({ estado: 'activa', ...(filtro && { carrera: filtro }) })
  const estado = useDatos(`/api/vacantes?${consulta}`)

  return (
    <section className="vacantes" aria-labelledby="vacantes-titulo">
      <div className="vacantes-cabecera">
        <h2 id="vacantes-titulo">Vacantes abiertas</h2>
        <form
          className="filtro"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            setFiltro(carrera.trim())
          }}
        >
          <label htmlFor="filtro-carrera">Carrera</label>
          <input
            id="filtro-carrera"
            list="lista-carreras"
            placeholder="Todas las carreras"
            value={carrera}
            onChange={(e) => {
              setCarrera(e.target.value)
              if (!e.target.value) setFiltro('')
            }}
          />
          <datalist id="lista-carreras">
            {CARRERAS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <button type="submit" className="boton boton--secundario">Filtrar</button>
        </form>
      </div>

      <Bloque estado={estado}>
        {(vacantes) =>
          vacantes.length === 0 ? (
            <Vacio titulo={filtro ? `No hay vacantes abiertas para ${filtro}.` : 'Todavía no hay vacantes abiertas.'}>
              <p>Las empresas publican sus vacantes aquí. Vuelve a revisar en unos días.</p>
            </Vacio>
          ) : (
            <ul className="hoja lista-vacantes">
              {vacantes.map((v) => (
                <li key={v.id} className="vacante">
                  <details>
                    <summary>
                      <span className="vacante-titulo">{v.titulo}</span>
                      <span className="vacante-empresa">
                        {v.empresa}{v.estado_republica && `, ${v.estado_republica}`}
                      </span>
                      <span className="vacante-carrera">
                        {v.carrera ? `${v.carrera}. ` : ''}{lugares(v)}
                      </span>
                    </summary>
                    <div className="vacante-detalle">
                      {v.descripcion && (
                        <div>
                          <h3>Descripción</h3>
                          <p>{v.descripcion}</p>
                        </div>
                      )}
                      {v.requisitos && (
                        <div>
                          <h3>Requisitos</h3>
                          <p>{v.requisitos}</p>
                        </div>
                      )}
                      {!v.descripcion && !v.requisitos && <p>La empresa no agregó descripción.</p>}
                      {v.fecha_publicacion && <p className="nota">Publicada el {fecha(v.fecha_publicacion)}</p>}
                    </div>
                  </details>
                  <div className="vacante-accion">
                    {v.estado !== 'activa' && <Estado valor={v.estado} />}
                    {accion?.(v)}
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </Bloque>
    </section>
  )
}
