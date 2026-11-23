
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool, { query } from '../config/database.js';

const crearToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
};

export const registrar = async (req, res) => {
  const {
    nombre,
    correo,
    password,
    rol,
    matricula,
    carrera,
    semestre,
    nombre_empresa,
    descripcion,
    direccion,
    telefono
  } = req.body;

  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    typeof correo !== 'string' ||
    !correo.trim() ||
    typeof password !== 'string' ||
    !rol
  ) {
    return res.status(400).json({
      mensaje: 'Nombre, correo, contraseña y rol son obligatorios'
    });
  }

  if (!['alumno', 'empresa'].includes(rol)) {
    return res.status(400).json({
      mensaje: 'Rol no permitido para registro público'
    });
  }

  if (
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      mensaje: 'La contraseña debe tener al menos 12 caracteres y no superar 72 bytes'
    });
  }

  if (rol === 'alumno' && (
    typeof matricula !== 'string' ||
    !matricula.trim() ||
    typeof carrera !== 'string' ||
    !carrera.trim()
  )) {
    return res.status(400).json({
      mensaje: 'Matrícula y carrera son obligatorias para alumnos'
    });
  }

  if (rol === 'empresa' && (
    typeof nombre_empresa !== 'string' ||
    !nombre_empresa.trim()
  )) {
    return res.status(400).json({
      mensaje: 'El nombre de la empresa es obligatorio'
    });
  }

  if (
    rol === 'alumno' &&
    semestre != null &&
    (!Number.isInteger(semestre) || semestre < 1)
  ) {
    return res.status(400).json({
      mensaje: 'El semestre debe ser un número entero positivo'
    });
  }

  let client;

  try {
    const correoNormalizado = correo.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 12);

    client = await pool.connect();
    await client.query('BEGIN');

    const resultado = await client.query(
      `INSERT INTO usuarios (nombre, correo, password, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, correo, rol`,
      [nombre.trim(), correoNormalizado, hash, rol]
    );

    const usuario = resultado.rows[0];

    if (rol === 'alumno') {
      await client.query(
        `INSERT INTO alumnos (
          usuario_id, matricula, carrera, semestre
        )
        VALUES ($1, $2, $3, $4)`,
        [
          usuario.id,
          matricula.trim(),
          carrera.trim(),
          semestre ?? null
        ]
      );
    }

    if (rol === 'empresa') {
      await client.query(
        `INSERT INTO empresas (
          usuario_id, nombre, descripcion, direccion, telefono
        )
        VALUES ($1, $2, $3, $4, $5)`,
        [
          usuario.id,
          nombre_empresa.trim(),
          descripcion ?? null,
          direccion ?? null,
          telefono ?? null
        ]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      mensaje: 'Usuario y perfil registrados correctamente',
      usuario
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }

    if (error.code === '23505') {
      return res.status(409).json({
        mensaje: 'El correo o la matrícula ya están registrados'
      });
    }

    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al registrar usuario'
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};

export const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (
      typeof correo !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        mensaje: 'Correo y contraseña obligatorios'
      });
    }

    const resultado = await query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo.trim().toLowerCase()]
    );

    const usuario = resultado.rows[0];

    if (
      !usuario ||
      !(await bcrypt.compare(password, usuario.password))
    ) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }

    const token = crearToken(usuario);

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al iniciar sesión'
    });
  }
};

export const perfil = async (req, res) => {
  try {
    const resultado = await query(
      'SELECT id, nombre, correo, rol FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al consultar perfil'
    });
  }
};
