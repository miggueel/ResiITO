
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const carpetaReportes = path.resolve('uploads', 'reportes');

// Crear la carpeta si todavía no existe
fs.mkdirSync(carpetaReportes, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaReportes);
  },

  filename: (req, file, cb) => {
    const nombreUnico = `${crypto.randomUUID()}.pdf`;
    cb(null, nombreUnico);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'));
  }
};

export const subirPDF = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});
