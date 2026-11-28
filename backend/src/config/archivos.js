import fs from 'node:fs';
import path from 'node:path';

// Carpeta donde se guardan los PDF de los reportes.
// En producción debe apuntar a un volumen persistente (UPLOADS_DIR=/data/uploads en Railway);
// el disco del contenedor se borra en cada despliegue.
export const carpetaUploads = path.resolve(process.env.UPLOADS_DIR || 'uploads');
export const carpetaReportes = path.join(carpetaUploads, 'reportes');

fs.mkdirSync(carpetaReportes, { recursive: true });

export const rutaReporte = (nombreArchivo) => path.join(carpetaReportes, nombreArchivo);
