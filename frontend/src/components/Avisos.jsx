import { createContext, useCallback, useContext, useState } from 'react'

const AvisosContext = createContext(() => {})

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((texto, tipo = 'bien') => {
    const id = crypto.randomUUID()
    setAvisos((a) => [...a, { id, texto, tipo }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4500)
  }, [])

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <p key={a.id} className={`aviso aviso--${a.tipo}`}>{a.texto}</p>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}

export const useAvisos = () => useContext(AvisosContext)
