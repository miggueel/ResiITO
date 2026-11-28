import { Router } from 'express';
import {
  crearPostulacion,
  misPostulaciones,
  postulacionesEmpresa,
  listarPostulaciones,
  decidirPostulacion
} from '../controllers/postulacionesController.js';
import { verificarToken, permitirRoles } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/postulaciones:
 *   post:
 *     tags: [Postulaciones]
 *     summary: Alumno se postula a un proyecto con lugares disponibles
 *     description: Máximo 3 postulaciones en revisión a la vez. Un alumno ya aceptado en un proyecto no puede postularse.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vacante_id]
 *             properties:
 *               vacante_id: { type: integer, example: 1 }
 *     responses:
 *       201: { description: Postulación creada }
 *       409: { description: Duplicada, sin cupo, límite de 3 postulaciones o alumno ya aceptado en otro proyecto }
 *   get:
 *     tags: [Postulaciones]
 *     summary: Coordinación consulta todas las postulaciones
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [pendiente, aceptado, rechazado] }
 *     responses:
 *       200: { description: Postulaciones con cupo del proyecto }
 */
router.post('/', verificarToken, permitirRoles('alumno'), crearPostulacion);
router.get('/', verificarToken, permitirRoles('coordinador'), listarPostulaciones);

/**
 * @openapi
 * /api/postulaciones/mis-postulaciones:
 *   get:
 *     tags: [Postulaciones]
 *     summary: Alumno consulta sus postulaciones
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de postulaciones del alumno }
 */
router.get('/mis-postulaciones', verificarToken, permitirRoles('alumno'), misPostulaciones);

/**
 * @openapi
 * /api/postulaciones/empresa:
 *   get:
 *     tags: [Postulaciones]
 *     summary: Empresa consulta (solo lectura) las postulaciones a sus proyectos
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Postulaciones recibidas }
 */
router.get('/empresa', verificarToken, permitirRoles('empresa'), postulacionesEmpresa);

/**
 * @openapi
 * /api/postulaciones/{id}/decision:
 *   patch:
 *     tags: [Postulaciones]
 *     summary: Coordinación acepta o rechaza a un alumno
 *     description: Al aceptar se respeta el cupo del proyecto y se abre la residencia en proceso con su periodo. Las demás postulaciones pendientes del alumno se retiran y, si el cupo queda completo, las pendientes del proyecto se rechazan.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado: { type: string, enum: [aceptado, rechazado] }
 *               fecha_inicio: { type: string, format: date, description: Obligatoria al aceptar }
 *               fecha_fin: { type: string, format: date, description: Obligatoria al aceptar }
 *     responses:
 *       200: { description: Postulación decidida }
 *       409: { description: Ya decidida, cupo lleno o alumno aceptado en otro proyecto }
 */
router.patch('/:id/decision', verificarToken, permitirRoles('coordinador'), decidirPostulacion);

export default router;
