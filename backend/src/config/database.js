
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

export const query = (text, params) => pool.query(text, params);

export const verificarConexion = async () => {
  const resultado = await pool.query('SELECT NOW() AS fecha');
  console.log('PostgreSQL conectado:', resultado.rows[0].fecha);
};

export default pool;
