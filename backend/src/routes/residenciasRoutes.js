import { Router } from 'express';
import {
  listarResidencias,
  misResidencias,
  residenciasEmpresa,
  residenciasDocente,
  obtenerResidencia,
  cambiarEstado
} from '../controllers/residenciasController.js';
import { reportesDeResidencia } from '../controllers/reportesController.js';
import { verificarToken, permitirRoles } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/residencias:
 *   get:
 *     tags: [Residencias]
 *     summary: Coordinación consulta todas las residencias
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Residencias con docentes, reportes y evaluación }
 */
router.get('/', verificarToken, permitirRoles('coordinador'), listarResidencias);

/**
 * @openapi
 * /api/residencias/mis-residencias:
 *   get:
 *     tags: [Residencias]
 *     summary: Alumno consulta su residencia, asesores y revisores
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Residencias del alumno }
 */
router.get('/mis-residencias', verificarToken, permitirRoles('alumno'), misResidencias);

/**
 * @openapi
 * /api/residencias/empresa:
 *   get:
 *     tags: [Residencias]
 *     summary: Empresa consulta las residencias de sus proyectos
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Residencias de la empresa }
 */
router.get('/empresa', verificarToken, permitirRoles('empresa'), residenciasEmpresa);

/**
 * @openapi
 * /api/residencias/docente:
 *   get:
 *     tags: [Residencias]
 *     summary: Docente consulta las residencias de los proyectos que asesora o revisa
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Residencias con su función (asesor o revisor) }
 */
router.get('/docente', verificarToken, permitirRoles('docente'), residenciasDocente);

/**
 * @openapi
 * /api/residencias/{id}:
 *   get:
 *     tags: [Residencias]
 *     summary: Detalle de una residencia (coordinación, alumno, empresa o docente asignado)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Residencia }
 *       403: { description: Sin acceso }
 */
router.get('/:id', verificarToken, obtenerResidencia);

/**
 * @openapi
 * /api/residencias/{id}/reportes:
 *   get:
 *     tags: [Residencias]
 *     summary: Reportes de una residencia con observaciones (alumno, docente asignado o coordinación)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Reportes }
 */
router.get('/:id/reportes', verificarToken, reportesDeResidencia);

/**
 * @openapi
 * /api/residencias/{id}/estado:
 *   patch:
 *     tags: [Residencias]
 *     summary: Coordinación inicia (aprobada → en_proceso) o libera (finalizada → liberada)
 *     description: Finalizada y no concluida las decide el docente al revisar el último reporte.
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
 *               estado: { type: string, enum: [en_proceso, liberada] }
 *     responses:
 *       200: { description: Estado actualizado }
 *       409: { description: Transición no permitida o falta evaluación }
 */
router.patch('/:id/estado', verificarToken, permitirRoles('coordinador'), cambiarEstado);

export default router;
