export const ESTADOS_REPUBLICA = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
  'Zacatecas'
];

// Devuelve un mensaje de error o null si la contraseña es válida
export const errorPassword = (password) => {
  if (typeof password !== 'string' || password.length < 12) {
    return 'La contraseña debe tener al menos 12 caracteres';
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return 'La contraseña no debe superar 72 bytes';
  }
  return null;
};

export const textoRequerido = (valor) =>
  typeof valor === 'string' && valor.trim().length > 0;

export const textoOpcional = (valor) =>
  typeof valor === 'string' && valor.trim() ? valor.trim() : null;

export const correoValido = (correo) =>
  typeof correo === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

export const idValido = (valor) => {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const fechaValida = (fecha) => {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const valor = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(valor.getTime()) && valor.toISOString().slice(0, 10) === fecha;
};
