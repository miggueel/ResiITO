import { Router } from 'express';
import {
  listarUsuarios,
  crearUsuario,
  reenviarInvitacion,
  enviarRestablecimiento,
  obtenerDetalleUsuario,
  actualizarUsuario,
  cambiarEstadoCuenta,
  eliminarUsuario
} from '../controllers/usuariosController.js';
import { verificarToken, permitirRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Todo este módulo es exclusivo de coordinación
router.use(verificarToken, permitirRoles('coordinador'));

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Coordinación consulta usuarios
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema: { type: string, enum: [alumno, empresa, docente, coordinador] }
 *     responses:
 *       200: { description: Lista de usuarios con su perfil y estado de cuenta }
 *   post:
 *     tags: [Usuarios]
 *     summary: Coordinación da de alta un alumno, empresa o docente
 *     description: La cuenta queda pendiente y se envía un enlace (48 h) para que el usuario cree su contraseña.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rol, nombre, correo]
 *             properties:
 *               rol: { type: string, enum: [alumno, empresa, docente] }
 *               nombre: { type: string }
 *               correo: { type: string }
 *               matricula: { type: string, description: Obligatorio para alumno }
 *               carrera: { type: string, description: Obligatorio para alumno }
 *               semestre: { type: integer }
 *               nombre_empresa: { type: string, description: Obligatorio para empresa }
 *               estado_republica: { type: string, example: Oaxaca, description: Obligatorio para empresa }
 *               descripcion: { type: string }
 *               direccion: { type: string }
 *               telefono: { type: string }
 *               numero_empleado: { type: string }
 *               departamento: { type: string }
 *     responses:
 *       201: { description: Usuario creado e invitación enviada }
 *       409: { description: Correo, número de control o de empleado duplicado }
 */
router.get('/', listarUsuarios);
router.post('/', crearUsuario);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Detalle de un usuario con el resumen de su historial
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: "Usuario, historial y si puede eliminarse" }
 *       404: { description: Usuario no encontrado }
 *   put:
 *     tags: [Usuarios]
 *     summary: Editar nombre, correo y datos del perfil (el rol no cambia)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, correo]
 *             properties:
 *               nombre: { type: string }
 *               correo: { type: string }
 *               matricula: { type: string }
 *               carrera: { type: string }
 *               semestre: { type: integer }
 *               nombre_empresa: { type: string }
 *               estado_republica: { type: string }
 *               descripcion: { type: string }
 *               direccion: { type: string }
 *               telefono: { type: string }
 *               numero_empleado: { type: string }
 *               departamento: { type: string }
 *     responses:
 *       200: { description: Datos guardados }
 *       409: { description: Correo, número de control o de empleado duplicado }
 *   delete:
 *     tags: [Usuarios]
 *     summary: Eliminar definitivamente una cuenta sin historial
 *     description: Si el usuario ya participó en residencias responde 409 y sugiere desactivarlo.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Cuenta eliminada }
 *       409: { description: Tiene historial; debe desactivarse }
 */
router.get('/:id', obtenerDetalleUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);

/**
 * @openapi
 * /api/usuarios/{id}/estado:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Desactivar o reactivar una cuenta
 *     description: Una cuenta desactivada no puede iniciar sesión, sus enlaces dejan de servir y su sesión abierta se cierra.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activa]
 *             properties:
 *               activa: { type: boolean }
 *     responses:
 *       200: { description: Estado de la cuenta actualizado }
 */
router.patch('/:id/estado', cambiarEstadoCuenta);

/**
 * @openapi
 * /api/usuarios/{id}/invitacion:
 *   post:
 *     tags: [Usuarios]
 *     summary: Reenviar el enlace de activación (el anterior deja de servir)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Invitación reenviada }
 *       409: { description: La cuenta ya está activa }
 */
router.post('/:id/invitacion', reenviarInvitacion);

/**
 * @openapi
 * /api/usuarios/{id}/restablecimiento:
 *   post:
 *     tags: [Usuarios]
 *     summary: Enviar enlace para restablecer contraseña
 *     description: La contraseña actual no cambia hasta que el usuario abre el enlace y guarda una nueva.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Enlace enviado }
 *       409: { description: La cuenta aún no está activa }
 */
router.post('/:id/restablecimiento', enviarRestablecimiento);

export default router;
