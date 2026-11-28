import { Router } from 'express';
import {
  crearSolicitud,
  listarSolicitudes,
  misSolicitudes,
  resolverSolicitud
} from '../controllers/solicitudesController.js';
import { verificarToken, permitirRoles } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/solicitudes:
 *   post:
 *     tags: [Solicitudes]
 *     summary: Docente solicita a coordinación corregir el estatus final de un proyecto
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [residencia_id, estado_solicitado, motivo]
 *             properties:
 *               residencia_id: { type: integer }
 *               estado_solicitado: { type: string, enum: [en_proceso, finalizada, no_concluida] }
 *               motivo: { type: string, minLength: 10 }
 *     responses:
 *       201: { description: Solicitud enviada }
 *       409: { description: Ya hay una solicitud pendiente o el proyecto no está cerrado }
 *   get:
 *     tags: [Solicitudes]
 *     summary: Coordinación consulta las solicitudes
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [pendiente, aprobada, rechazada] }
 *     responses:
 *       200: { description: Solicitudes }
 */
router.post('/', verificarToken, permitirRoles('docente'), crearSolicitud);
router.get('/', verificarToken, permitirRoles('coordinador'), listarSolicitudes);

/**
 * @openapi
 * /api/solicitudes/mias:
 *   get:
 *     tags: [Solicitudes]
 *     summary: Docente consulta sus solicitudes
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Solicitudes del docente }
 */
router.get('/mias', verificarToken, permitirRoles('docente'), misSolicitudes);

/**
 * @openapi
 * /api/solicitudes/{id}:
 *   patch:
 *     tags: [Solicitudes]
 *     summary: Coordinación aprueba (aplica el cambio) o rechaza la solicitud
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
 *               decision: { type: string, enum: [aprobada, rechazada] }
 *               respuesta: { type: string, description: Obligatoria al rechazar }
 *     responses:
 *       200: { description: Solicitud resuelta }
 */
router.patch('/:id', verificarToken, permitirRoles('coordinador'), resolverSolicitud);

export default router;
