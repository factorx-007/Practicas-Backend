import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configuración de almacenamiento en memoria para Cloudinary
const storage = multer.memoryStorage();

// Filtro de archivos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipos de archivo permitidos
  const allowedTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    videos: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']
  };

  const allAllowedTypes = [...allowedTypes.images, ...allowedTypes.documents, ...allowedTypes.videos];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

// Configuración principal de multer
export const uploadConfig = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite general
    files: 5 // Máximo 5 archivos por request
  }
});

// Configuraciones específicas
export const uploadConfigs = {
  // Para avatares y logos (solo imágenes, 2MB max)
  avatar: multer({
    storage: storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes para avatares'));
      }
    },
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
      files: 1
    }
  }),

  // Para CVs (solo documentos, 5MB max)
  cv: multer({
    storage: storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten documentos PDF o Word para CVs'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    }
  }),

  // Para posts (imágenes y videos, 10MB max)
  post: multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 3 // Máximo 3 archivos por post
    }
  }),

  // Para galería de empresa (solo imágenes, 5MB max)
  gallery: multer({
    storage: storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes para la galería'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    }
  })
};

export default uploadConfig;