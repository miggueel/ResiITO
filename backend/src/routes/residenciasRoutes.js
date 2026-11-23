
import { Router } from 'express';

import {
  listarPendientes,
  aprobarResidencia,
  listarResidencias,
  misResidencias,
  cambiarEstado
} from '../controllers/residenciasController.js';

import {
  verificarToken,
  permitirRoles
} from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/residencias/pendientes:
 *   get:
 *     tags: [Residencias]
 *     summary: Consultar postulaciones aceptadas pendientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postulaciones aceptadas
 *       403:
 *         description: Acceso denegado
 */
router.get(
  '/pendientes',
  verificarToken,
  permitirRoles('coordinador'),
  listarPendientes
);

/**
 * @openapi
 * /api/residencias/mis-residencias:
 *   get:
 *     tags: [Residencias]
 *     summary: Consultar mis residencias como alumno
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Residencias del alumno
 */
router.get(
  '/mis-residencias',
  verificarToken,
  permitirRoles('alumno'),
  misResidencias
);

/**
 * @openapi
 * /api/residencias:
 *   get:
 *     tags: [Residencias]
 *     summary: Consultar todas las residencias
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de residencias
 */
router.get(
  '/',
  verificarToken,
  permitirRoles('coordinador'),
  listarResidencias
);

/**
 * @openapi
 * /api/residencias:
 *   post:
 *     tags: [Residencias]
 *     summary: Aprobar una residencia profesional
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postulacion_id
 *               - asesor
 *               - fecha_inicio
 *               - fecha_fin
 *             properties:
 *               postulacion_id:
 *                 type: integer
 *                 example: 1
 *               asesor:
 *                 type: string
 *                 example: Dr. Juan Pérez
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: 2026-12-01
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 example: 2027-04-01
 *     responses:
 *       201:
 *         description: Residencia aprobada correctamente
 *       409:
 *         description: Postulación no aceptada o residencia existente
 */
router.post(
  '/',
  verificarToken,
  permitirRoles('coordinador'),
  aprobarResidencia
);

/**
 * @openapi
 * /api/residencias/{id}/estado:
 *   patch:
 *     tags: [Residencias]
 *     summary: Cambiar el estado de una residencia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la residencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum:
 *                   - en_proceso
 *                   - finalizada
 *                   - liberada
 *                 example: en_proceso
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       409:
 *         description: Transición no permitida
 */
router.patch(
  '/:id/estado',
  verificarToken,
  permitirRoles('coordinador'),
  cambiarEstado
);

export default router;
