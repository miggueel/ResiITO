
import multer from 'multer';
import crypto from 'node:crypto';
import { carpetaReportes } from '../config/archivos.js';

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
