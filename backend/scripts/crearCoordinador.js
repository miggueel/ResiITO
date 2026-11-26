// Crea una cuenta de coordinador (revisor de residencias).
// El registro público solo permite alumno y empresa, así que las cuentas
// de coordinación se dan de alta desde el servidor con este script:
//
//   npm run crear-coordinador
//
import readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';

const esTerminal = Boolean(stdin.isTTY);
const rl = readline.createInterface({ input: stdin, output: stdout, terminal: esTerminal });
const lineas = rl[Symbol.asyncIterator]();

// En terminal, se silencia el eco mientras se escribe la contraseña
let ocultar = false;
if (esTerminal) {
  const escribir = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (texto) => {
    if (!ocultar) escribir(texto);
  };
}

const preguntar = async (texto, { oculto = false } = {}) => {
  stdout.write(texto);
  ocultar = oculto;
  const { value } = await lineas.next();
  ocultar = false;
  if (oculto || !esTerminal) stdout.write('\n');
  return value ?? '';
};

const salirConError = async (mensaje) => {
  console.error(`\n✖ ${mensaje}`);
  rl.close();
  await pool.end();
  process.exit(1);
};

console.log('\nNueva cuenta de coordinación para ResiITO\n');

const nombre = (await preguntar('Nombre completo: ')).trim();
const correo = (await preguntar('Correo: ')).trim().toLowerCase();
const password = await preguntar('Contraseña (mínimo 12 caracteres): ', { oculto: true });
const confirmacion = await preguntar('Repite la contraseña: ', { oculto: true });

if (!nombre) await salirConError('El nombre es obligatorio.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) await salirConError('El correo no es válido.');
if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
  await salirConError('La contraseña debe tener al menos 12 caracteres y no superar 72 bytes.');
}
if (password !== confirmacion) await salirConError('Las contraseñas no coinciden.');

try {
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password, rol)
     VALUES ($1, $2, $3, 'coordinador')
     RETURNING id, nombre, correo, rol`,
    [nombre, correo, hash]
  );
  console.log(`\n✔ Coordinador creado: ${rows[0].nombre} <${rows[0].correo}> (id ${rows[0].id})`);
  console.log('  Ya puede iniciar sesión en ResiITO con ese correo y contraseña.\n');
} catch (error) {
  if (error.code === '23505') await salirConError('Ya existe una cuenta con ese correo.');
  await salirConError(`No se pudo crear la cuenta: ${error.message}`);
}

rl.close();
await pool.end();
