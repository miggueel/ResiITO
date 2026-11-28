import { Router } from 'express';
import {
  subirReporte,
  reemplazarReporte,
  misReportes,
  listarReportes,
  reportesPorRevisar,
  revisarReporte,
  crearObservacion,
  descargarReporte
} from '../controllers/reportesController.js';
import { verificarToken, permitirRoles } from '../middleware/authMiddleware.js';
import { subirPDF } from '../middleware/uploadMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/reportes:
 *   post:
 *     tags: [Reportes]
 *     summary: Alumno entrega un reporte en PDF (compartido con su equipo)
 *     description: Solo cuando la residencia está en proceso y el proyecto ya tiene asesor y revisor asignados.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [residencia_id, numero_reporte, archivo]
 *             properties:
 *               residencia_id: { type: integer }
 *               numero_reporte: { type: integer }
 *               archivo: { type: string, format: binary }
 *     responses:
 *       201: { description: Reporte entregado }
 *       409: { description: Reporte duplicado o al proyecto le falta asesor o revisor }
 *   get:
 *     tags: [Reportes]
 *     summary: Coordinación consulta todos los reportes (solo lectura)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Reportes con observaciones }
 */
router.post('/', verificarToken, permitirRoles('alumno'), subirPDF.single('archivo'), subirReporte);
router.get('/', verificarToken, permitirRoles('coordinador'), listarReportes);

/**
 * @openapi
 * /api/reportes/mis-reportes:
 *   get:
 *     tags: [Reportes]
 *     summary: Alumno consulta sus reportes con las observaciones de sus docentes
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Reportes del alumno }
 */
router.get('/mis-reportes', verificarToken, permitirRoles('alumno'), misReportes);

/**
 * @openapi
 * /api/reportes/por-revisar:
 *   get:
 *     tags: [Reportes]
 *     summary: Docente consulta los reportes pendientes de sus proyectos
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Reportes pendientes }
 */
router.get('/por-revisar', verificarToken, permitirRoles('docente'), reportesPorRevisar);

/**
 * @openapi
 * /api/reportes/{id}/revision:
 *   patch:
 *     tags: [Reportes]
 *     summary: Docente da visto bueno, regresa para corrección o cierra con el último reporte
 *     description: |
 *       Si es_ultimo es true: "aprobado" deja la residencia finalizada y
 *       "no_concluido" la deja no concluida.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [aprobado, rechazado, no_concluido] }
 *               es_ultimo: { type: boolean, default: false }
 *     responses:
 *       200: { description: Reporte revisado }
 *       403: { description: El docente no está asignado al proyecto }
 *       409: { description: Ya revisado o hay reportes anteriores sin visto bueno }
 */
router.patch('/:id/revision', verificarToken, permitirRoles('docente'), revisarReporte);

/**
 * @openapi
 * /api/reportes/{id}/observaciones:
 *   post:
 *     tags: [Reportes]
 *     summary: Docente marca un error, deja un comentario o propone una idea
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, contenido]
 *             properties:
 *               tipo: { type: string, enum: [error, comentario, propuesta] }
 *               pagina: { type: integer, minimum: 1 }
 *               contenido: { type: string }
 *     responses:
 *       201: { description: Observación registrada }
 */
router.post('/:id/observaciones', verificarToken, permitirRoles('docente'), crearObservacion);

/**
 * @openapi
 * /api/reportes/{id}/archivo:
 *   get:
 *     tags: [Reportes]
 *     summary: Descargar el PDF (alumno dueño, empresa, docente asignado o coordinación)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       403: { description: Sin permisos }
 *   put:
 *     tags: [Reportes]
 *     summary: Alumno entrega la corrección de un reporte regresado
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [archivo]
 *             properties:
 *               archivo: { type: string, format: binary }
 *     responses:
 *       200: { description: Corrección entregada; el reporte vuelve a revisión }
 *       409: { description: El reporte no está regresado para corrección }
 */
router.get('/:id/archivo', verificarToken, descargarReporte);
router.put('/:id/archivo', verificarToken, permitirRoles('alumno'), subirPDF.single('archivo'), reemplazarReporte);

export default router;
