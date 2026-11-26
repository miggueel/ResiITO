import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Cargando } from './components/Estados.jsx'
import { INICIO_POR_ROL, useAuth } from './auth.jsx'
import Layout from './components/Layout.jsx'
import Inicio from './pages/Inicio.jsx'
import Entrar from './pages/Entrar.jsx'
import Registro from './pages/Registro.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import MiResidencia from './pages/alumno/MiResidencia.jsx'
import VacantesAlumno from './pages/alumno/VacantesAlumno.jsx'
import MisPostulaciones from './pages/alumno/MisPostulaciones.jsx'
import MisReportes from './pages/alumno/MisReportes.jsx'
import MisVacantes from './pages/empresa/MisVacantes.jsx'
import PostulacionesEmpresa from './pages/empresa/PostulacionesEmpresa.jsx'
import Residentes from './pages/empresa/Residentes.jsx'
import PorAprobar from './pages/coordinacion/PorAprobar.jsx'
import Residencias from './pages/coordinacion/Residencias.jsx'
import Reportes from './pages/coordinacion/Reportes.jsx'
import Evaluaciones from './pages/coordinacion/Evaluaciones.jsx'

// Protección de interfaz: oculta pantallas ajenas al rol. La seguridad real
// está en el backend (verificarToken + permitirRoles en cada ruta).
function SoloRol({ rol, children }) {
  const { usuario, verificando } = useAuth()
  const ubicacion = useLocation()
  if (verificando) return <Cargando texto="Verificando tu sesión…" />
  if (!usuario) return <Navigate to="/entrar" replace state={{ desde: ubicacion.pathname }} />
  if (usuario.rol !== rol) return <Navigate to={INICIO_POR_ROL[usuario.rol] ?? '/'} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="entrar" element={<Entrar />} />
        <Route path="registro" element={<Registro />} />

        <Route path="alumno" element={<SoloRol rol="alumno"><MiResidencia /></SoloRol>} />
        <Route path="alumno/vacantes" element={<SoloRol rol="alumno"><VacantesAlumno /></SoloRol>} />
        <Route path="alumno/postulaciones" element={<SoloRol rol="alumno"><MisPostulaciones /></SoloRol>} />
        <Route path="alumno/reportes" element={<SoloRol rol="alumno"><MisReportes /></SoloRol>} />

        <Route path="empresa" element={<SoloRol rol="empresa"><MisVacantes /></SoloRol>} />
        <Route path="empresa/postulaciones" element={<SoloRol rol="empresa"><PostulacionesEmpresa /></SoloRol>} />
        <Route path="empresa/residentes" element={<SoloRol rol="empresa"><Residentes /></SoloRol>} />

        <Route path="coordinacion" element={<SoloRol rol="coordinador"><PorAprobar /></SoloRol>} />
        <Route path="coordinacion/residencias" element={<SoloRol rol="coordinador"><Residencias /></SoloRol>} />
        <Route path="coordinacion/reportes" element={<SoloRol rol="coordinador"><Reportes /></SoloRol>} />
        <Route path="coordinacion/evaluaciones" element={<SoloRol rol="coordinador"><Evaluaciones /></SoloRol>} />

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
