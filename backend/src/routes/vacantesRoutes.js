import { Router } from 'express';
import {
  listarVacantes,
  obtenerVacante,
  crearVacante,
  actualizarVacante,
  eliminarVacante,
  misVacantes,
  listarProyectosCoordinacion,
  revisarVacante,
  actualizarCupo,
  asignarDocente,
  quitarDocente
} from '../controllers/vacantesController.js';
import { verificarToken, permitirRoles } from '../middleware/authMiddleware.js';

const router = Router();
const empresa = [verificarToken, permitirRoles('empresa')];
const coordinacion = [verificarToken, permitirRoles('coordinador')];

/**
 * @openapi
 * components:
 *   schemas:
 *     VacanteInput:
 *       type: object
 *       required: [titulo]
 *       properties:
 *         titulo: { type: string, example: Desarrollador Web }
 *         descripcion: { type: string }
 *         carrera: { type: string, example: Ingeniería en Sistemas Computacionales }
 *         requisitos: { type: string }
 *         estado:
 *           type: string
 *           enum: [activa, cerrada]
 *           description: Solo aplica a proyectos ya aprobados
 */

/**
 * @openapi
 * /api/vacantes:
 *   get:
 *     tags: [Vacantes]
 *     summary: Proyectos aprobados y abiertos (público)
 *     parameters:
 *       - { in: query, name: carrera, schema: { type: string } }
 *     responses:
 *       200: { description: Lista de vacantes con cupo y aceptados }
 *   post:
 *     tags: [Vacantes]
 *     summary: Empresa propone un proyecto (queda pendiente de aprobación)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VacanteInput' }
 *     responses:
 *       201: { description: Proyecto enviado a coordinación }
 */
router.get('/', listarVacantes);
router.post('/', ...empresa, crearVacante);

/**
 * @openapi
 * /api/vacantes/mias:
 *   get:
 *     tags: [Vacantes]
 *     summary: Empresa consulta sus proyectos (con estado de aprobación, cupo y docentes)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Proyectos de la empresa }
 */
router.get('/mias', ...empresa, misVacantes);

/**
 * @openapi
 * /api/vacantes/coordinacion:
 *   get:
 *     tags: [Vacantes]
 *     summary: Coordinación consulta todos los proyectos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [pendiente, activa, cerrada, rechazada] }
 *     responses:
 *       200: { description: Proyectos con cupo, postulaciones y docentes }
 */
router.get('/coordinacion', ...coordinacion, listarProyectosCoordinacion);

/**
 * @openapi
 * /api/vacantes/{id}:
 *   get:
 *     tags: [Vacantes]
 *     summary: Consultar un proyecto abierto
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Vacante encontrada }
 *       404: { description: Vacante no encontrada o no abierta }
 *   put:
 *     tags: [Vacantes]
 *     summary: Empresa edita su proyecto (si estaba rechazado, vuelve a revisión)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VacanteInput' }
 *     responses:
 *       200: { description: Vacante actualizada }
 *   delete:
 *     tags: [Vacantes]
 *     summary: Empresa elimina su proyecto (si no tiene postulaciones)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Vacante eliminada }
 *       409: { description: Tiene postulaciones asociadas }
 */
router.get('/:id', obtenerVacante);
router.put('/:id', ...empresa, actualizarVacante);
router.delete('/:id', ...empresa, eliminarVacante);

/**
 * @openapi
 * /api/vacantes/{id}/revision:
 *   patch:
 *     tags: [Vacantes]
 *     summary: Coordinación aprueba (con cupo) o rechaza (con motivo) un proyecto
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
 *               decision: { type: string, enum: [aprobar, rechazar] }
 *               cupo: { type: integer, minimum: 1, description: Obligatorio al aprobar }
 *               motivo: { type: string, description: Obligatorio al rechazar }
 *     responses:
 *       200: { description: Proyecto revisado }
 *       409: { description: El proyecto ya fue revisado }
 */
router.patch('/:id/revision', ...coordinacion, revisarVacante);

/**
 * @openapi
 * /api/vacantes/{id}/cupo:
 *   patch:
 *     tags: [Vacantes]
 *     summary: Coordinación ajusta el cupo de alumnos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cupo]
 *             properties:
 *               cupo: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Cupo actualizado }
 *       409: { description: El cupo es menor que los alumnos ya aceptados }
 */
router.patch('/:id/cupo', ...coordinacion, actualizarCupo);

/**
 * @openapi
 * /api/vacantes/{id}/docentes:
 *   post:
 *     tags: [Vacantes]
 *     summary: Coordinación asigna un docente como asesor o revisor
 *     description: Solo cuando el proyecto ya tiene a todos sus alumnos aceptados (cupo completo). Cada proyecto tiene un único asesor y un único revisor, y un docente no puede ser ambos en el mismo proyecto.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [docente_id, funcion]
 *             properties:
 *               docente_id: { type: integer }
 *               funcion: { type: string, enum: [asesor, revisor] }
 *     responses:
 *       201: { description: Docente asignado }
 *       409: { description: Proyecto no aprobado, sin el equipo completo, función ya ocupada o docente ya asignado }
 * /api/vacantes/{id}/docentes/{docenteId}:
 *   delete:
 *     tags: [Vacantes]
 *     summary: Coordinación retira a un docente del proyecto
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: docenteId, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Docente retirado }
 */
router.post('/:id/docentes', ...coordinacion, asignarDocente);
router.delete('/:id/docentes/:docenteId', ...coordinacion, quitarDocente);

export default router;
