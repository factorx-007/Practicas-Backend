import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { ApiResponseHandler } from '../utils/responses';
import logger from '../utils/logger';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    logger.warn('Errores de validación:', {
      url: req.url,
      method: req.method,
      errors: formattedErrors,
      body: req.body,
      userId: (req as any).user?.id
    });

    return ApiResponseHandler.validationError(res, formattedErrors, 'Errores de validación');
  }

  next();
};

// Middleware para validar tipos de archivo en uploads
export const validateFileType = (allowedTypes: string[], fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;
    const files = (req as any).files;

    if (!file && (!files || Object.keys(files).length === 0)) {
      return next(); // No hay archivos, continuar
    }

    // Validar archivo único
    if (file) {
      if (!allowedTypes.includes(file.mimetype)) {
        logger.warn('Tipo de archivo no permitido:', {
          fieldName,
          mimetype: file.mimetype,
          allowedTypes,
          userId: (req as any).user?.id
        });
        return ApiResponseHandler.error(res, 
          `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`, 
          415
        );
      }
    }

    // Validar múltiples archivos
    if (files && typeof files === 'object' && !Array.isArray(files)) {
      for (const field in files) {
        const fieldFiles = Array.isArray((files as any)[field]) ? (files as any)[field] : [(files as any)[field]];
        
        for (const file of fieldFiles) {
          if (!allowedTypes.includes(file.mimetype)) {
            logger.warn('Tipo de archivo no permitido en campo múltiple:', {
              field,
              mimetype: file.mimetype,
              allowedTypes,
              userId: (req as any).user?.id
            });
            return ApiResponseHandler.error(res, 
              `Tipo de archivo no permitido en campo ${field}. Tipos permitidos: ${allowedTypes.join(', ')}`, 
              415
            );
          }
        }
      }
    }

    next();
  };
};

// Middleware para validar tamaño de archivo
export const validateFileSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;
    const files = (req as any).files;

    if (!file && (!files || Object.keys(files).length === 0)) {
      return next(); // No hay archivos, continuar
    }

    // Validar archivo único
    if (file && file.size > maxSize) {
      logger.warn('Archivo demasiado grande:', {
        size: file.size,
        maxSize,
        filename: file.originalname,
        userId: (req as any).user?.id
      });
      return ApiResponseHandler.error(res, 
        `Archivo demasiado grande. Tamaño máximo: ${Math.round(maxSize / 1024 / 1024)}MB`, 
        413
      );
    }

    // Validar múltiples archivos
    if (files && typeof files === 'object' && !Array.isArray(files)) {
      for (const field in files) {
        const fieldFiles = Array.isArray((files as any)[field]) ? (files as any)[field] : [(files as any)[field]];
        
        for (const file of fieldFiles) {
          if (file.size > maxSize) {
            logger.warn('Archivo demasiado grande en campo múltiple:', {
              field,
              size: file.size,
              maxSize,
              filename: file.originalname,
              userId: (req as any).user?.id
            });
            return ApiResponseHandler.error(res, 
              `Archivo en campo ${field} demasiado grande. Tamaño máximo: ${Math.round(maxSize / 1024 / 1024)}MB`, 
              413
            );
          }
        }
      }
    }

    next();
  };
};

// Middleware para sanitizar entrada de datos
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitizar strings en body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitizar query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Función auxiliar para sanitizar objetos
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj
      .trim()
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, ''); // Remover eventos onclick, onload, etc.
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

// Middleware para validar que el ID sea válido
export const validateId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return ApiResponseHandler.error(res, `${paramName} inválido`, 400);
    }

    // Validar formato CUID (usado por Prisma)
    const cuidRegex = /^c[a-z0-9]{24}$/;
    if (!cuidRegex.test(id)) {
      return ApiResponseHandler.error(res, `Formato de ${paramName} inválido`, 400);
    }

    next();
  };
};

// Middleware para validar paginación
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;

  if (page && isNaN(Number(page))) {
    return ApiResponseHandler.error(res, 'Page debe ser un número', 400);
  }

  if (limit && isNaN(Number(limit))) {
    return ApiResponseHandler.error(res, 'Limit debe ser un número', 400);
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  if (pageNum < 1) {
    return ApiResponseHandler.error(res, 'Page debe ser mayor a 0', 400);
  }

  if (limitNum < 1 || limitNum > 100) {
    return ApiResponseHandler.error(res, 'Limit debe estar entre 1 y 100', 400);
  }

  // Agregar valores validados al request
  req.query.page = pageNum.toString();
  req.query.limit = limitNum.toString();

  next();
};

// Middleware para validar fechas
export const validateDateRange = (startField: string = 'startDate', endField: string = 'endDate') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startDate = req.query[startField] || req.body[startField];
    const endDate = req.query[endField] || req.body[endField];

    if (startDate && isNaN(Date.parse(startDate as string))) {
      return ApiResponseHandler.error(res, `${startField} debe ser una fecha válida`, 400);
    }

    if (endDate && isNaN(Date.parse(endDate as string))) {
      return ApiResponseHandler.error(res, `${endField} debe ser una fecha válida`, 400);
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (start >= end) {
        return ApiResponseHandler.error(res, `${startField} debe ser anterior a ${endField}`, 400);
      }
    }

    next();
  };
};

export default {
  handleValidationErrors,
  validateFileType,
  validateFileSize,
  sanitizeInput,
  validateId,
  validatePagination,
  validateDateRange
};