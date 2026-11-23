
import { Router } from 'express';
import { registrar, login, perfil } from '../controllers/authController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/auth/registro:
 *   post:
 *     tags: [Autenticación]
 *     summary: Registrar alumno o empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, correo, password, rol]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Alumno Prueba
 *               correo:
 *                 type: string
 *                 example: alumno@itoaxaca.edu.mx
 *               password:
 *                 type: string
 *                 format: password
 *                 example: PruebaSegura2026!
 *               rol:
 *                 type: string
 *                 enum: [alumno, empresa]
 *     responses:
 *       201:
 *         description: Usuario registrado
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Correo duplicado
 */
router.post('/registro', registrar);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión y obtener JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo, password]
 *             properties:
 *               correo:
 *                 type: string
 *                 example: alumno@itoaxaca.edu.mx
 *               password:
 *                 type: string
 *                 format: password
 *                 example: PruebaSegura2026!
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     tags: [Autenticación]
 *     summary: Consultar perfil autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: Token inválido o ausente
 */
router.get('/perfil', verificarToken, perfil);

export default router;
