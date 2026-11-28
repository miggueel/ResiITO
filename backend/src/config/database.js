
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// En Railway (y otros servicios) la conexión llega en DATABASE_URL.
// En desarrollo se usan las variables DB_* del archivo .env.
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      }
);

export const query = (text, params) => pool.query(text, params);

export const verificarConexion = async () => {
  const resultado = await pool.query('SELECT NOW() AS fecha');
  console.log('PostgreSQL conectado:', resultado.rows[0].fecha);
};

export default pool;
