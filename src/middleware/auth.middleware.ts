import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { jwtUtils } from '../utils/helpers';
import { ApiResponseHandler } from '../utils/responses';
import { JwtPayload, AuthUser } from '../types/auth.types';
import { UserRole } from '../types/common.types';
import logger from '../utils/logger';
import prisma from '../config/database';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Middleware para verificar autenticación
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header Authorization o de las cookies
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      logger.security('Intento de acceso sin token', req.ip || 'unknown', {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      return ApiResponseHandler.unauthorized(res, 'Token de acceso requerido');
    }

    // Verificar token (ya validamos que token no es undefined arriba)
    let payload: JwtPayload;
    try {
      payload = jwtUtils.verifyAccessToken(token!);
    } catch (error: any) {
      logger.security('Token inválido o expirado', req.ip || 'unknown', {
        url: req.url,
        method: req.method,
        error: error.message
      });
      
      if (error.name === 'TokenExpiredError') {
        return ApiResponseHandler.unauthorized(res, 'Token expirado');
      }
      return ApiResponseHandler.unauthorized(res, 'Token inválido');
    }

    // Verificar que el usuario existe y está activo
    const user = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        emailVerificado: true,
        perfilCompleto: true
      }
    });

    if (!user) {
      logger.security('Token válido pero usuario no existe', req.ip || 'unknown', {
        userId: payload.userId
      });
      return ApiResponseHandler.unauthorized(res, 'Usuario no encontrado');
    }

    if (!user.activo) {
      logger.security('Usuario inactivo intentó acceder', req.ip || 'unknown', {
        userId: user.id,
        email: user.email
      });
      return ApiResponseHandler.forbidden(res, 'Cuenta desactivada');
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol as UserRole,
      emailVerificado: user.emailVerificado,
      perfilCompleto: user.perfilCompleto
    };

    logger.debug('Usuario autenticado exitosamente', {
      userId: user.id,
      email: user.email,
      rol: user.rol
    });

    next();
  } catch (error) {
    logger.error('Error en middleware de autenticación:', error);
    return ApiResponseHandler.error(res, 'Error interno de autenticación', 500);
  }
};

// Middleware para verificar roles específicos
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
    }

    if (!allowedRoles.includes(req.user.rol)) {
      logger.security('Acceso denegado por rol insuficiente', req.ip || 'unknown', {
        userId: req.user.id,
        userRole: req.user.rol,
        requiredRoles: allowedRoles,
        url: req.url,
        method: req.method
      });
      return ApiResponseHandler.forbidden(res, 'No tienes permisos para acceder a este recurso');
    }

    next();
  };
};

// Middleware para verificar que el email esté verificado
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
  }

  if (!req.user.emailVerificado) {
    return ApiResponseHandler.forbidden(res, 'Email no verificado. Verifica tu email antes de continuar.');
  }

  next();
};

// Middleware para verificar que el perfil esté completo
export const requireCompleteProfile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
  }

  if (!req.user.perfilCompleto) {
    return ApiResponseHandler.forbidden(res, 'Perfil incompleto. Completa tu perfil antes de continuar.');
  }

  next();
};

// Middleware para verificar que el usuario sea dueño del recurso
export const requireOwnership = (userIdField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
    }

    // El ID del usuario puede venir de params, body, o query
    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];

    if (!resourceUserId) {
      return ApiResponseHandler.error(res, 'ID de usuario no proporcionado', 400);
    }

    // Administradores pueden acceder a cualquier recurso
    if (req.user.rol === UserRole.ADMIN) {
      return next();
    }

    // Verificar que el usuario sea dueño del recurso
    if (req.user.id !== resourceUserId) {
      logger.security('Intento de acceso a recurso no propio', req.ip || 'unknown', {
        userId: req.user.id,
        resourceUserId,
        url: req.url,
        method: req.method
      });
      return ApiResponseHandler.forbidden(res, 'No puedes acceder a este recurso');
    }

    next();
  };
};

// Middleware opcional de autenticación (no requiere token)
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Intentar autenticar, pero no fallar si no hay token
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(); // Continuar sin autenticación
    }

    // Verificar token si existe (ya validamos que token no es undefined arriba)
    try {
      const payload = jwtUtils.verifyAccessToken(token!);
      
      const user = await prisma.usuario.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          rol: true,
          activo: true,
          emailVerificado: true,
          perfilCompleto: true
        }
      });

      if (user && user.activo) {
        req.user = {
          id: user.id,
          email: user.email,
          rol: user.rol as UserRole,
          emailVerificado: user.emailVerificado,
          perfilCompleto: user.perfilCompleto
        };
      }
    } catch (error) {
      // Ignorar errores de token en autenticación opcional
      logger.debug('Token inválido en autenticación opcional:', error);
    }

    next();
  } catch (error) {
    logger.error('Error en middleware de autenticación opcional:', error);
    next(); // Continuar sin autenticación en caso de error
  }
};

export default {
  authenticate,
  authorize,
  requireEmailVerification,
  requireCompleteProfile,
  requireOwnership,
  optionalAuthenticate
};