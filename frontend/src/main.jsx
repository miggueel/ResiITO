import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth.jsx'
import { AvisosProvider } from './components/Avisos.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AvisosProvider>
          <App />
        </AvisosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
