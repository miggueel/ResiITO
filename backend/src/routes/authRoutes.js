import { Router } from 'express';
import {
  login,
  perfil,
  cambiarPassword,
  consultarEnlace,
  usarEnlace
} from '../controllers/authController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// El registro público ya no existe: coordinación da de alta a los usuarios (/api/usuarios).

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
 *               correo: { type: string, example: alumno@itoaxaca.edu.mx }
 *               password: { type: string, format: password }
 *     responses:
 *       200: { description: Inicio de sesión exitoso }
 *       401: { description: Credenciales incorrectas o cuenta sin activar }
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     tags: [Autenticación]
 *     summary: Consultar perfil autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil del usuario }
 *       401: { description: Token inválido o cuenta inactiva }
 */
router.get('/perfil', verificarToken, perfil);

/**
 * @openapi
 * /api/auth/password:
 *   patch:
 *     tags: [Autenticación]
 *     summary: El usuario cambia su propia contraseña
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password_actual, password_nueva]
 *             properties:
 *               password_actual: { type: string, format: password }
 *               password_nueva: { type: string, format: password, minLength: 12 }
 *     responses:
 *       200: { description: Contraseña actualizada }
 *       400: { description: Contraseña actual incorrecta o nueva inválida }
 */
router.patch('/password', verificarToken, cambiarPassword);

/**
 * @openapi
 * /api/auth/enlace/{token}:
 *   get:
 *     tags: [Autenticación]
 *     summary: Consultar un enlace de activación o restablecimiento
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "Enlace vigente: tipo, nombre y correo" }
 *       404: { description: Enlace usado, vencido o inexistente }
 *   post:
 *     tags: [Autenticación]
 *     summary: Crear contraseña (activación) o elegir una nueva (restablecimiento)
 *     description: La contraseña solo cambia cuando se usa el enlace. Es de un solo uso.
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, format: password, minLength: 12 }
 *     responses:
 *       200: { description: Contraseña guardada }
 *       404: { description: Enlace usado, vencido o inexistente }
 */
router.get('/enlace/:token', consultarEnlace);
router.post('/enlace/:token', usarEnlace);

export default router;
