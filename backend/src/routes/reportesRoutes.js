
import { Router } from 'express';

import {
  subirReporte,
  misReportes,
  listarReportes,
  revisarReporte,
  descargarReporte
} from '../controllers/reportesController.js';

import {
  verificarToken,
  permitirRoles
} from '../middleware/authMiddleware.js';

import { subirPDF } from '../middleware/uploadMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/reportes:
 *   post:
 *     tags: [Reportes]
 *     summary: Alumno sube un reporte mensual en PDF
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - residencia_id
 *               - numero_reporte
 *               - archivo
 *             properties:
 *               residencia_id:
 *                 type: integer
 *                 example: 1
 *               numero_reporte:
 *                 type: integer
 *                 example: 1
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Reporte registrado correctamente
 *       400:
 *         description: Datos o archivo inválidos
 *       403:
 *         description: Residencia no autorizada
 *       409:
 *         description: Reporte duplicado
 */
router.post(
  '/',
  verificarToken,
  permitirRoles('alumno'),
  subirPDF.single('archivo'),
  subirReporte
);

/**
 * @openapi
 * /api/reportes/mis-reportes:
 *   get:
 *     tags: [Reportes]
 *     summary: Alumno consulta sus reportes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes del alumno
 */
router.get(
  '/mis-reportes',
  verificarToken,
  permitirRoles('alumno'),
  misReportes
);

/**
 * @openapi
 * /api/reportes:
 *   get:
 *     tags: [Reportes]
 *     summary: Coordinador consulta todos los reportes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes
 */
router.get(
  '/',
  verificarToken,
  permitirRoles('coordinador'),
  listarReportes
);

/**
 * @openapi
 * /api/reportes/{id}/estado:
 *   patch:
 *     tags: [Reportes]
 *     summary: Coordinador aprueba o rechaza un reporte
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
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [aprobado, rechazado]
 *                 example: aprobado
 *     responses:
 *       200:
 *         description: Reporte revisado correctamente
 *       409:
 *         description: Reporte no encontrado o ya revisado
 */
router.patch(
  '/:id/estado',
  verificarToken,
  permitirRoles('coordinador'),
  revisarReporte
);


/**
 * @openapi
 * /api/reportes/{id}/archivo:
 *   get:
 *     tags: [Reportes]
 *     summary: Descargar un reporte PDF
 *     description: Permite descargar el PDF al alumno propietario, a la empresa correspondiente o al coordinador.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del reporte
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: ID o archivo inválido
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Sin permisos para descargar el PDF
 *       404:
 *         description: Reporte no encontrado
 */
router.get(
  '/:id/archivo',
  verificarToken,
  descargarReporte
);


export default router;
