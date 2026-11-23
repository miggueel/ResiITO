
import { Router } from 'express';

import {
  crearPostulacion,
  misPostulaciones,
  postulacionesEmpresa,
  actualizarEstado
} from '../controllers/postulacionesController.js';

import {
  verificarToken,
  permitirRoles
} from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/postulaciones:
 *   post:
 *     tags: [Postulaciones]
 *     summary: Alumno se postula a una vacante
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vacante_id]
 *             properties:
 *               vacante_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Postulación creada
 *       409:
 *         description: Postulación duplicada
 */
router.post(
  '/',
  verificarToken,
  permitirRoles('alumno'),
  crearPostulacion
);

/**
 * @openapi
 * /api/postulaciones/mis-postulaciones:
 *   get:
 *     tags: [Postulaciones]
 *     summary: Alumno consulta sus postulaciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postulaciones del alumno
 */
router.get(
  '/mis-postulaciones',
  verificarToken,
  permitirRoles('alumno'),
  misPostulaciones
);

/**
 * @openapi
 * /api/postulaciones/empresa:
 *   get:
 *     tags: [Postulaciones]
 *     summary: Empresa consulta las postulaciones recibidas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Postulaciones recibidas
 */
router.get(
  '/empresa',
  verificarToken,
  permitirRoles('empresa'),
  postulacionesEmpresa
);

/**
 * @openapi
 * /api/postulaciones/{id}/estado:
 *   patch:
 *     tags: [Postulaciones]
 *     summary: Empresa acepta o rechaza una postulación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [aceptado, rechazado]
 *                 example: aceptado
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       404:
 *         description: Postulación no encontrada o ya procesada
 */
router.patch(
  '/:id/estado',
  verificarToken,
  permitirRoles('empresa'),
  actualizarEstado
);

export default router;
