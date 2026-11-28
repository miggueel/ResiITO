import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Cargando } from './components/Estados.jsx'
import { INICIO_POR_ROL, useAuth } from './auth.jsx'
import Layout from './components/Layout.jsx'
import Inicio from './pages/Inicio.jsx'
import Entrar from './pages/Entrar.jsx'
import Enlace from './pages/Enlace.jsx'
import Cuenta from './pages/Cuenta.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import MiResidencia from './pages/alumno/MiResidencia.jsx'
import VacantesAlumno from './pages/alumno/VacantesAlumno.jsx'
import MisPostulaciones from './pages/alumno/MisPostulaciones.jsx'
import MisReportes from './pages/alumno/MisReportes.jsx'
import MisVacantes from './pages/empresa/MisVacantes.jsx'
import PostulacionesEmpresa from './pages/empresa/PostulacionesEmpresa.jsx'
import Residentes from './pages/empresa/Residentes.jsx'
import MisResidentes from './pages/docente/MisResidentes.jsx'
import RevisionResidencia from './pages/docente/RevisionResidencia.jsx'
import MisSolicitudes from './pages/docente/MisSolicitudes.jsx'
import Proyectos from './pages/coordinacion/Proyectos.jsx'
import Postulaciones from './pages/coordinacion/Postulaciones.jsx'
import Residencias from './pages/coordinacion/Residencias.jsx'
import Reportes from './pages/coordinacion/Reportes.jsx'
import Solicitudes from './pages/coordinacion/Solicitudes.jsx'
import Evaluaciones from './pages/coordinacion/Evaluaciones.jsx'
import Usuarios from './pages/coordinacion/Usuarios.jsx'

// Protección de interfaz: oculta pantallas ajenas al rol. La seguridad real
// está en el backend (verificarToken + permitirRoles en cada ruta).
function SoloRol({ rol, children }) {
  const { usuario, verificando } = useAuth()
  const ubicacion = useLocation()
  if (verificando) return <Cargando texto="Verificando tu sesión…" />
  if (!usuario) return <Navigate to="/entrar" replace state={{ desde: ubicacion.pathname }} />
  if (rol && usuario.rol !== rol) return <Navigate to={INICIO_POR_ROL[usuario.rol] ?? '/'} replace />
  return children
}

const protegida = (rol, elemento) => <SoloRol rol={rol}>{elemento}</SoloRol>

// Vacantes y postulaciones: solo para alumnos que aún no están en un proyecto
function SinResidencia({ children }) {
  const { usuario } = useAuth()
  if (usuario?.en_residencia) return <Navigate to="/alumno" replace />
  return children
}

const paraPostular = (elemento) => protegida('alumno', <SinResidencia>{elemento}</SinResidencia>)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="entrar" element={<Entrar />} />
        <Route path="activar/:token" element={<Enlace tipo="activacion" />} />
        <Route path="restablecer/:token" element={<Enlace tipo="restablecimiento" />} />
        <Route path="cuenta" element={protegida(null, <Cuenta />)} />

        <Route path="alumno" element={protegida('alumno', <MiResidencia />)} />
        <Route path="alumno/vacantes" element={paraPostular(<VacantesAlumno />)} />
        <Route path="alumno/postulaciones" element={paraPostular(<MisPostulaciones />)} />
        <Route path="alumno/reportes" element={protegida('alumno', <MisReportes />)} />

        <Route path="empresa" element={protegida('empresa', <MisVacantes />)} />
        <Route path="empresa/postulaciones" element={protegida('empresa', <PostulacionesEmpresa />)} />
        <Route path="empresa/residentes" element={protegida('empresa', <Residentes />)} />

        <Route path="docente" element={protegida('docente', <MisResidentes />)} />
        <Route path="docente/residencias/:id" element={protegida('docente', <RevisionResidencia />)} />
        <Route path="docente/solicitudes" element={protegida('docente', <MisSolicitudes />)} />

        <Route path="coordinacion" element={protegida('coordinador', <Proyectos />)} />
        <Route path="coordinacion/postulaciones" element={protegida('coordinador', <Postulaciones />)} />
        <Route path="coordinacion/residencias" element={protegida('coordinador', <Residencias />)} />
        <Route path="coordinacion/reportes" element={protegida('coordinador', <Reportes />)} />
        <Route path="coordinacion/solicitudes" element={protegida('coordinador', <Solicitudes />)} />
        <Route path="coordinacion/evaluaciones" element={protegida('coordinador', <Evaluaciones />)} />
        <Route path="coordinacion/usuarios" element={protegida('coordinador', <Usuarios />)} />

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
