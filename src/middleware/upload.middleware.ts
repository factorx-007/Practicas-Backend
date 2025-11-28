import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import uploadService from '../services/upload.service';
import { ApiResponseHandler } from '../utils/responses';
import logger from '../utils/logger';

// Extender el tipo Request para incluir archivos subidos
declare global {
  namespace Express {
    interface Request {
      uploadedFiles?: {
        [fieldname: string]: {
          public_id: string;
          secure_url: string;
          original_name: string;
          size: number;
          format: string;
          resource_type: string;
        }[];
      };
    }
  }
}

// Configuración de memoria storage para multer (temporal)
const storage = multer.memoryStorage();

// Función para validar tipos de archivo
const createFileFilter = (allowedTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (uploadService.isValidFileType(file.mimetype, allowedTypes)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Tipos aceptados: ${allowedTypes.join(', ')}`));
    }
  };
};

// Middleware base de multer
const createMulterUpload = (
  fieldConfigs: { name: string; maxCount?: number }[],
  allowedTypes: string[],
  maxSize: number = 10 * 1024 * 1024 // 10MB por defecto
) => {
  return multer({
    storage,
    limits: {
      fileSize: maxSize,
      files: 10 // máximo 10 archivos por request
    },
    fileFilter: createFileFilter(allowedTypes)
  }).fields(fieldConfigs);
};

// Middleware para procesar archivos y subirlos a Cloudinary
const processCloudinaryUpload = (
  uploadType: 'profile' | 'post' | 'general',
  options: {
    folder?: string;
    fileType?: 'avatar' | 'logo' | 'cv' | 'image' | 'video';
    allowedFields?: string[];
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const uploadedFiles: any = {};

      if (!files || Object.keys(files).length === 0) {
        return next(); // No hay archivos, continuar
      }

      const userId = req.user?.id;
      const postId = req.body.postId || req.params.postId;

      // Procesar cada campo de archivo
      for (const [fieldName, fileArray] of Object.entries(files)) {
        if (options.allowedFields && !options.allowedFields.includes(fieldName)) {
          continue; // Saltar campos no permitidos
        }

        uploadedFiles[fieldName] = [];

        for (const file of fileArray) {
          try {
            let uploadResult;

            // Decidir el tipo de upload según el contexto
            switch (uploadType) {
              case 'profile':
                if (!userId) {
                  throw new Error('Usuario no autenticado para subida de perfil');
                }
                if (!options.fileType) {
                  throw new Error('Tipo de archivo de perfil no especificado');
                }
                uploadResult = await uploadService.uploadProfileFile(
                  file.buffer,
                  userId,
                  options.fileType as 'avatar' | 'logo' | 'cv'
                );
                break;

              case 'post':
                if (!userId) {
                  throw new Error('Usuario no autenticado para subida de post');
                }
                // Para creación de posts, usar carpeta general con userId
                // El postId puede no existir aún al crear un nuevo post
                const postResourceType = file.mimetype.startsWith('image/') ? 'image' : 'video';

                uploadResult = await uploadService.uploadFromBuffer(file.buffer, {
                  folder: `protalent/posts/${userId}`,
                  resource_type: postResourceType as any
                });
                break;

              case 'general':
              default:
                const resourceType = file.mimetype.startsWith('image/')
                  ? 'image'
                  : file.mimetype.startsWith('video/')
                    ? 'video'
                    : 'raw';

                uploadResult = await uploadService.uploadFromBuffer(file.buffer, {
                  folder: options.folder || 'protalent/general',
                  resource_type: resourceType as any
                });
                break;
            }

            // Agregar información del archivo subido
            uploadedFiles[fieldName].push({
              public_id: uploadResult.public_id,
              secure_url: uploadResult.secure_url,
              original_name: file.originalname,
              size: uploadResult.bytes,
              format: uploadResult.format,
              resource_type: uploadResult.resource_type,
              width: uploadResult.width,
              height: uploadResult.height
            });

            logger.info(`Archivo subido exitosamente: ${file.originalname} -> ${uploadResult.public_id}`);

          } catch (uploadError) {
            logger.error('Error al subir archivo individual:', uploadError);
            throw new Error(`Error al subir ${file.originalname}: ${uploadError}`);
          }
        }
      }

      // Agregar archivos subidos al request
      req.uploadedFiles = uploadedFiles;
      next();

    } catch (error) {
      logger.error('Error en processCloudinaryUpload:', error);
      return ApiResponseHandler.error(res, `Error al procesar archivos: ${error}`, 400);
    }
  };
};

// Middleware específicos para diferentes tipos de upload

// Upload de avatar de usuario
export const uploadAvatar: any[] = [
  createMulterUpload(
    [{ name: 'avatar', maxCount: 1 }],
    uploadService.getFileTypeConfig('avatar').allowedTypes,
    uploadService.getFileTypeConfig('avatar').maxSize
  ),
  processCloudinaryUpload('profile', { fileType: 'avatar', allowedFields: ['avatar'] })
];

// Upload de logo de empresa/institución
export const uploadLogo: any[] = [
  createMulterUpload(
    [{ name: 'logo', maxCount: 1 }],
    uploadService.getFileTypeConfig('avatar').allowedTypes, // Mismo que avatar
    uploadService.getFileTypeConfig('avatar').maxSize
  ),
  processCloudinaryUpload('profile', { fileType: 'logo', allowedFields: ['logo'] })
];

// Upload de CV
export const uploadCV: any[] = [
  createMulterUpload(
    [{ name: 'cv', maxCount: 1 }],
    uploadService.getFileTypeConfig('cv').allowedTypes,
    uploadService.getFileTypeConfig('cv').maxSize
  ),
  processCloudinaryUpload('profile', { fileType: 'cv', allowedFields: ['cv'] })
];

// Upload de archivos para posts sociales
export const uploadPostMedia: any[] = [
  createMulterUpload(
    [
      { name: 'images', maxCount: 5 },
      { name: 'videos', maxCount: 2 }
    ],
    [
      ...uploadService.getFileTypeConfig('image').allowedTypes,
      ...uploadService.getFileTypeConfig('video').allowedTypes
    ],
    100 * 1024 * 1024 // 100MB para videos
  ),
  processCloudinaryUpload('post', { allowedFields: ['images', 'videos'] })
];

// Upload de archivos para chat
export const uploadChatMedia: any[] = [
  createMulterUpload(
    [
      { name: 'images', maxCount: 3 },
      { name: 'videos', maxCount: 1 },
      { name: 'files', maxCount: 2 }
    ],
    [
      ...uploadService.getFileTypeConfig('image').allowedTypes,
      ...uploadService.getFileTypeConfig('video').allowedTypes,
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    50 * 1024 * 1024 // 50MB para chat
  ),
  processCloudinaryUpload('general', {
    folder: 'protalent/chat',
    allowedFields: ['images', 'videos', 'files']
  })
];

// Upload general (flexible)
export const uploadGeneral: any = (
  fields: { name: string; maxCount?: number }[],
  allowedTypes: string[],
  maxSize?: number,
  folder?: string
) => [
  createMulterUpload(fields, allowedTypes, maxSize),
  processCloudinaryUpload('general', {
    folder,
    allowedFields: fields.map(f => f.name)
  })
];

// Middleware para manejar errores de multer
export const handleMulterError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return ApiResponseHandler.error(res, 'Archivo demasiado grande', 413);
      case 'LIMIT_FILE_COUNT':
        return ApiResponseHandler.error(res, 'Demasiados archivos', 413);
      case 'LIMIT_UNEXPECTED_FILE':
        return ApiResponseHandler.error(res, 'Campo de archivo no esperado', 400);
      default:
        return ApiResponseHandler.error(res, `Error de archivo: ${error.message}`, 400);
    }
  }

  if (error.message.includes('Tipo de archivo no permitido')) {
    return ApiResponseHandler.error(res, error.message, 415);
  }

  return ApiResponseHandler.error(res, 'Error al procesar archivos', 500);
};

// Helper para validar que se subieron archivos requeridos
export const requireFiles = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadedFiles = req.uploadedFiles || {};
    const missingFields = requiredFields.filter(field =>
      !uploadedFiles[field] || uploadedFiles[field].length === 0
    );

    if (missingFields.length > 0) {
      return ApiResponseHandler.error(
        res,
        `Archivos requeridos faltantes: ${missingFields.join(', ')}`,
        400
      );
    }

    next();
  };
};

// Helper para limpiar archivos subidos en caso de error
export const cleanupUploadedFiles = async (req: Request) => {
  const uploadedFiles = req.uploadedFiles || {};

  try {
    for (const [fieldName, files] of Object.entries(uploadedFiles)) {
      for (const file of files) {
        await uploadService.deleteFile(file.public_id, file.resource_type as any);
        logger.info(`Archivo limpiado: ${file.public_id}`);
      }
    }
  } catch (error) {
    logger.error('Error al limpiar archivos subidos:', error);
  }
};

// Middleware para limpiar archivos en caso de error en el controlador
export const autoCleanupOnError = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;

  res.send = function(this: Response, body: any) {
    // Si hay error (status 4xx o 5xx), limpiar archivos
    if (this.statusCode >= 400 && req.uploadedFiles) {
      cleanupUploadedFiles(req).catch(err =>
        logger.error('Error en auto-cleanup:', err)
      );
    }

    return originalSend.call(this, body);
  };

  next();
};