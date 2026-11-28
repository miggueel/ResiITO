
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes.js';
import vacantesRoutes from './routes/vacantesRoutes.js';
import postulacionesRoutes from './routes/postulacionesRoutes.js';
import residenciasRoutes from './routes/residenciasRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';
import evaluacionesRoutes from './routes/evaluacionesRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import solicitudesRoutes from './routes/solicitudesRoutes.js';

import swaggerSpec from './config/swagger.js';
import { verificarConexion } from './config/database.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// En producción solo el frontend (FRONTEND_URL) puede llamar a la API desde el navegador.
// Se aceptan varias URL separadas por comas.
const origenes = (process.env.FRONTEND_URL || '')
  .split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);

app.use(cors(
  process.env.NODE_ENV === 'production' && origenes.length > 0 ? { origin: origenes } : {}
));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/vacantes', vacantesRoutes);
app.use('/api/postulaciones', postulacionesRoutes);
app.use('/api/residencias', residenciasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/solicitudes', solicitudesRoutes);

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Sistema
 *     summary: Verificar el funcionamiento de ResiITO
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 */
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Bienvenido a ResiITO',
    proyecto: 'Plataforma de Residencias Profesionales del ITO',
    estado: 'Servidor funcionando correctamente'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await verificarConexion();
    res.json({
      estado: 'OK',
      baseDatos: 'PostgreSQL conectada'
    });
  } catch (error) {
    res.status(503).json({
      estado: 'ERROR',
      mensaje: 'No se pudo conectar a PostgreSQL'
    });
  }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Errores de subida de archivos (multer) y JSON mal formado: responder en JSON
app.use((error, req, res, next) => {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ mensaje: 'El PDF no debe pesar más de 10 MB' });
  }
  if (error?.message === 'Solo se permiten archivos PDF') {
    return res.status(400).json({ mensaje: error.message });
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es JSON válido' });
  }
  console.error(error);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found'
  });
});

const iniciarServidor = async () => {
  try {
    await verificarConexion();

    app.listen(PORT, () => {
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Error al conectar PostgreSQL:', error.message);
    process.exit(1);
  }
};

iniciarServidor();
