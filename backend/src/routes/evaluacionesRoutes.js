
import { Router } from 'express';

import {
  crearEvaluacion,
  listarEvaluaciones,
  misEvaluaciones
} from '../controllers/evaluacionesController.js';

import {
  verificarToken,
  permitirRoles
} from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/evaluaciones:
 *   post:
 *     tags: [Evaluaciones]
 *     summary: Empresa evalúa a un alumno residente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - residencia_id
 *               - calificacion
 *             properties:
 *               residencia_id:
 *                 type: integer
 *                 example: 1
 *               calificacion:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 95
 *               observaciones:
 *                 type: string
 *                 example: Excelente desempeño y responsabilidad
 *     responses:
 *       201:
 *         description: Evaluación registrada correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Empresa no autorizada
 *       409:
 *         description: La residencia ya tiene una evaluación
 */
router.post(
  '/',
  verificarToken,
  permitirRoles('empresa'),
  crearEvaluacion
);

/**
 * @openapi
 * /api/evaluaciones/mis-evaluaciones:
 *   get:
 *     tags: [Evaluaciones]
 *     summary: Alumno consulta sus evaluaciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Evaluaciones del alumno
 */
router.get(
  '/mis-evaluaciones',
  verificarToken,
  permitirRoles('alumno'),
  misEvaluaciones
);

/**
 * @openapi
 * /api/evaluaciones:
 *   get:
 *     tags: [Evaluaciones]
 *     summary: Coordinador consulta todas las evaluaciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de evaluaciones
 */
router.get(
  '/',
  verificarToken,
  permitirRoles('coordinador'),
  listarEvaluaciones
);

export default router;
