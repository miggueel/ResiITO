// Aplica en orden los archivos de database/migraciones que aún no se han ejecutado.
// Lleva el registro en la tabla "migraciones".
//
//   npm run migrar
//
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../src/config/database.js';

const carpeta = path.resolve('database', 'migraciones');

const cliente = await pool.connect();

try {
  await cliente.query(`
    CREATE TABLE IF NOT EXISTS migraciones (
      nombre VARCHAR(255) PRIMARY KEY,
      fecha_aplicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const aplicadas = new Set(
    (await cliente.query('SELECT nombre FROM migraciones')).rows.map((r) => r.nombre)
  );

  // Bases creadas antes de existir 000_esquema_inicial.sql ya tienen las tablas base:
  // se registra como aplicada para no intentar crearlas de nuevo.
  const ESQUEMA_INICIAL = '000_esquema_inicial.sql';
  if (!aplicadas.has(ESQUEMA_INICIAL)) {
    const { rows: [base] } = await cliente.query(`SELECT to_regclass('public.usuarios') IS NOT NULL AS existe`);
    if (base.existe) {
      await cliente.query('INSERT INTO migraciones (nombre) VALUES ($1)', [ESQUEMA_INICIAL]);
      aplicadas.add(ESQUEMA_INICIAL);
      console.log(`✔ ${ESQUEMA_INICIAL}: las tablas base ya existían, se marcó como aplicada.`);
    }
  }

  const archivos = (await fs.readdir(carpeta)).filter((a) => a.endsWith('.sql')).sort();
  const pendientes = archivos.filter((a) => !aplicadas.has(a));

  if (pendientes.length === 0) {
    console.log('✔ La base de datos ya está al día.');
  }

  for (const archivo of pendientes) {
    const sql = await fs.readFile(path.join(carpeta, archivo), 'utf8');
    process.stdout.write(`→ Aplicando ${archivo}… `);
    await cliente.query('BEGIN');
    try {
      await cliente.query(sql);
      await cliente.query('INSERT INTO migraciones (nombre) VALUES ($1)', [archivo]);
      await cliente.query('COMMIT');
      console.log('listo');
    } catch (error) {
      await cliente.query('ROLLBACK');
      console.log('falló');
      throw new Error(`${archivo}: ${error.message}`);
    }
  }
} catch (error) {
  console.error(`\n✖ No se aplicó ningún cambio de la migración que falló.\n  ${error.message}`);
  process.exitCode = 1;
} finally {
  cliente.release();
  await pool.end();
}
