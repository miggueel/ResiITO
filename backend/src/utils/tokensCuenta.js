import crypto from 'node:crypto';

export const HORAS_ACTIVACION = 48;
export const HORAS_RESTABLECIMIENTO = 24;

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Crea un enlace de un solo uso. Los enlaces anteriores sin usar del
// mismo tipo dejan de servir. Recibe un cliente para poder ir en transacción.
export async function crearTokenCuenta(cliente, usuarioId, tipo, horas) {
  const token = crypto.randomBytes(32).toString('base64url');

  await cliente.query(
    `DELETE FROM tokens_cuenta
     WHERE usuario_id = $1 AND tipo = $2 AND usado_en IS NULL`,
    [usuarioId, tipo]
  );

  await cliente.query(
    `INSERT INTO tokens_cuenta (usuario_id, tipo, token_hash, expira_en)
     VALUES ($1, $2, $3, NOW() + make_interval(hours => $4))`,
    [usuarioId, tipo, hashToken(token), horas]
  );

  return token;
}
