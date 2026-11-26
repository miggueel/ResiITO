import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'

// Carga una o varias rutas GET y expone recargar()
export function useDatos(rutas) {
  const clave = JSON.stringify(rutas)
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true
    const lista = JSON.parse(clave)
    const esLista = Array.isArray(lista)
    setEstado((e) => ({ ...e, cargando: true, error: null }))
    Promise.all((esLista ? lista : [lista]).map((r) => (r ? api(r) : Promise.resolve(null))))
      .then((res) => vigente && setEstado({ datos: esLista ? res : res[0], error: null, cargando: false }))
      .catch((error) => vigente && setEstado({ datos: null, error, cargando: false }))
    return () => {
      vigente = false
    }
  }, [clave, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  return { ...estado, recargar }
}
