const BASE = import.meta.env.VITE_API_URL ?? ''
export const CLAVE_TOKEN = 'resiito.token'

export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.status = status
  }
}

async function solicitar(ruta, { method = 'GET', body, form } = {}) {
  const token = localStorage.getItem(CLAVE_TOKEN)
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(BASE + ruta, { method, headers, body: payload })
  } catch {
    throw new ApiError(
      'No hay conexión con el servidor. Verifica que el backend esté en marcha en el puerto 3000.',
      0,
    )
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event('resiito:sesion-expirada'))
    }
    throw new ApiError(
      data?.mensaje || data?.message || `El servidor respondió con el error ${res.status}.`,
      res.status,
    )
  }
  return res
}

export async function api(ruta, opciones) {
  const res = await solicitar(ruta, opciones)
  return res.json().catch(() => null)
}

// Pide un PDF protegido con JWT y devuelve una URL local (blob:) para mostrarlo.
// Quien la use debe liberarla con URL.revokeObjectURL cuando ya no la necesite.
export async function obtenerReporte(id) {
  const res = await solicitar(`/api/reportes/${id}/archivo`)
  const blob = await res.blob()
  return URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
}
