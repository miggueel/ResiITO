import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, CLAVE_TOKEN } from './api.js'

const CLAVE_USUARIO = 'resiito.usuario'
const AuthContext = createContext(null)

export const INICIO_POR_ROL = {
  alumno: '/alumno',
  empresa: '/empresa',
  coordinador: '/coordinacion',
  docente: '/docente',
}

// Lee la fecha de expiración del JWT (solo para cerrar la sesión a tiempo;
// la validación real de la firma la hace siempre el backend)
function expiracionToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(base64))
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

function tokenVigente() {
  const token = localStorage.getItem(CLAVE_TOKEN)
  if (!token) return null
  const exp = expiracionToken(token)
  return exp && exp > Date.now() ? token : null
}

function limpiarSesion() {
  localStorage.removeItem(CLAVE_TOKEN)
  localStorage.removeItem(CLAVE_USUARIO)
}

function leerUsuario() {
  if (!tokenVigente()) {
    limpiarSesion()
    return null
  }
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIO))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuario)
  // Mientras no confirmemos la sesión con el servidor, no se muestran páginas protegidas
  const [verificando, setVerificando] = useState(() => Boolean(tokenVigente()))
  const [expirada, setExpirada] = useState(false)

  const salir = useCallback(() => {
    limpiarSesion()
    setUsuario(null)
    setVerificando(false)
  }, [])

  const guardarUsuario = useCallback((u) => {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u))
    setUsuario(u)
  }, [])

  // Actualiza datos del usuario en sesión sin volver a iniciarla
  const actualizarUsuario = useCallback((cambios) => {
    setUsuario((u) => {
      if (!u) return u
      const nuevo = { ...u, ...cambios }
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(nuevo))
      return nuevo
    })
  }, [])

  const entrar = useCallback(async (correo, password) => {
    const data = await api('/api/auth/login', { method: 'POST', body: { correo, password } })
    localStorage.setItem(CLAVE_TOKEN, data.token)
    guardarUsuario(data.usuario)
    setExpirada(false)
    setVerificando(false)
    return data.usuario
  }, [guardarUsuario])

  // Al abrir la app: el servidor confirma el token y devuelve el rol real
  // desde la base de datos. Lo guardado en localStorage no se toma como verdad.
  useEffect(() => {
    if (!tokenVigente()) return
    let vigente = true
    api('/api/auth/perfil')
      .then((perfil) => vigente && guardarUsuario(perfil))
      .catch((err) => {
        // 401 ya dispara 'resiito:sesion-expirada'; sin conexión no se puede confirmar
        if (vigente && err.status !== 401) salir()
      })
      .finally(() => vigente && setVerificando(false))
    return () => {
      vigente = false
    }
  }, [guardarUsuario, salir])

  // Cerrar sesión automáticamente cuando el token caduque
  useEffect(() => {
    if (!usuario) return
    const exp = expiracionToken(localStorage.getItem(CLAVE_TOKEN) ?? '')
    if (!exp) return
    const id = setTimeout(() => {
      salir()
      setExpirada(true)
    }, Math.max(0, exp - Date.now()))
    return () => clearTimeout(id)
  }, [usuario, salir])

  useEffect(() => {
    const alExpirar = () => {
      salir()
      setExpirada(true)
    }
    window.addEventListener('resiito:sesion-expirada', alExpirar)
    return () => window.removeEventListener('resiito:sesion-expirada', alExpirar)
  }, [salir])

  return (
    <AuthContext.Provider value={{ usuario, entrar, salir, expirada, verificando, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
