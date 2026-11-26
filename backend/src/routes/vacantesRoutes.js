
import { Router } from 'express';

import {
  listarVacantes,
  obtenerVacante,
  crearVacante,
  actualizarVacante,
  eliminarVacante,
  misVacantes
} from '../controllers/vacantesController.js';

import {
  verificarToken,
  permitirRoles
} from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     VacanteInput:
 *       type: object
 *       required: [titulo]
 *       properties:
 *         titulo:
 *           type: string
 *           example: Desarrollador Web
 *         descripcion:
 *           type: string
 *           example: Desarrollo de aplicaciones web
 *         carrera:
 *           type: string
 *           example: Ingeniería en Sistemas Computacionales
 *         requisitos:
 *           type: string
 *           example: Conocimientos de JavaScript y PostgreSQL
 *     VacanteUpdate:
 *       allOf:
 *         - $ref: '#/components/schemas/VacanteInput'
 *         - type: object
 *           required: [estado]
 *           properties:
 *             estado:
 *               type: string
 *               enum: [activa, cerrada]
 */

/**
 * @openapi
 * /api/vacantes:
 *   get:
 *     tags: [Vacantes]
 *     summary: Consultar todas las vacantes
 *     parameters:
 *       - in: query
 *         name: carrera
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de vacantes
 */
router.get('/', listarVacantes);

/**
 * @openapi
 * /api/vacantes/mias:
 *   get:
 *     tags: [Vacantes]
 *     summary: Empresa consulta sus propias vacantes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vacantes de la empresa autenticada
 */
router.get(
  '/mias',
  verificarToken,
  permitirRoles('empresa'),
  misVacantes
);

/**
 * @openapi
 * /api/vacantes/{id}:
 *   get:
 *     tags: [Vacantes]
 *     summary: Consultar una vacante por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vacante encontrada
 *       404:
 *         description: Vacante no encontrada
 */
router.get('/:id', obtenerVacante);

/**
 * @openapi
 * /api/vacantes:
 *   post:
 *     tags: [Vacantes]
 *     summary: Publicar vacante (empresa)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VacanteInput'
 *     responses:
 *       201:
 *         description: Vacante creada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.post(
  '/',
  verificarToken,
  permitirRoles('empresa'),
  crearVacante
);

/**
 * @openapi
 * /api/vacantes/{id}:
 *   put:
 *     tags: [Vacantes]
 *     summary: Actualizar vacante (empresa propietaria)
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
 *             $ref: '#/components/schemas/VacanteUpdate'
 *     responses:
 *       200:
 *         description: Vacante actualizada
 *       404:
 *         description: Vacante no encontrada
 */
router.put(
  '/:id',
  verificarToken,
  permitirRoles('empresa'),
  actualizarVacante
);

/**
 * @openapi
 * /api/vacantes/{id}:
 *   delete:
 *     tags: [Vacantes]
 *     summary: Eliminar vacante (empresa propietaria)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vacante eliminada
 *       409:
 *         description: Vacante con postulaciones asociadas
 */
router.delete(
  '/:id',
  verificarToken,
  permitirRoles('empresa'),
  eliminarVacante
);

export default router;
