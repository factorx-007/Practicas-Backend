import { Request, Response } from 'express';
import { ApiResponseHandler } from '../utils/responses';
import authService from '../services/auth.service';
import logger from '../utils/logger';
import { authConfig } from '../config/auth';

export class AuthController {
  // Registro de usuario
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);

      // Configurar cookies con tokens
      this.setTokenCookies(res, result.tokens);

      logger.info('Usuario registrado exitosamente', {
        userId: result.user.id,
        email: result.user.email,
        rol: result.user.rol
      });

      return ApiResponseHandler.created(res, result, 'Usuario registrado exitosamente');
    } catch (error: any) {
      logger.error('Error en registro:', error, {
        email: req.body.email,
        rol: req.body.rol
      });

      // Manejar errores específicos
      switch (error.message) {
        case 'EMAIL_ALREADY_EXISTS':
          return ApiResponseHandler.conflict(res, 'El email ya está registrado');
        case 'RUC_ALREADY_EXISTS':
          return ApiResponseHandler.conflict(res, 'El RUC ya está registrado');
        case 'INSTITUTION_CODE_ALREADY_EXISTS':
          return ApiResponseHandler.conflict(res, 'El código institucional ya está registrado');
        default:
          return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    }
  }

  // Login de usuario
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);

      // Configurar cookies con tokens
      this.setTokenCookies(res, result.tokens);

      logger.info('Login exitoso', {
        userId: result.user.id,
        email: result.user.email,
        rol: result.user.rol
      });

      return ApiResponseHandler.success(res, result, 'Login exitoso');
    } catch (error: any) {
      logger.error('Error en login:', error, {
        email: req.body.email
      });

      // Manejar errores específicos
      switch (error.message) {
        case 'INVALID_CREDENTIALS':
          return ApiResponseHandler.unauthorized(res, 'Email o contraseña incorrectos');
        case 'ACCOUNT_DISABLED':
          return ApiResponseHandler.forbidden(res, 'Cuenta desactivada');
        case 'PASSWORD_NOT_SET':
          return ApiResponseHandler.error(res, 'Usuario registrado con Google, usa login social', 400);
        default:
          return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    }
  }

  // Login con Google
  async googleAuth(req: Request, res: Response) {
    try {
      const result = await authService.googleAuth(req.body);

      // Configurar cookies con tokens
      this.setTokenCookies(res, result.tokens);

      logger.info('Login con Google exitoso', {
        userId: result.user.id,
        email: result.user.email,
        rol: result.user.rol
      });

      return ApiResponseHandler.success(res, result, 'Login con Google exitoso');
    } catch (error: any) {
      logger.error('Error en Google Auth:', error, {
        email: req.body.email,
        googleId: req.body.googleId
      });

      // Manejar errores específicos
      switch (error.message) {
        case 'ACCOUNT_DISABLED':
          return ApiResponseHandler.forbidden(res, 'Cuenta desactivada');
        default:
          return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    }
  }

  // Refrescar tokens
  async refreshTokens(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponseHandler.error(res, 'Refresh token requerido', 400);
      }

      const tokens = await authService.refreshTokens(refreshToken);

      // Configurar cookies con nuevos tokens
      this.setTokenCookies(res, tokens);

      logger.info('Tokens refrescados exitosamente');

      return ApiResponseHandler.success(res, tokens, 'Tokens refrescados exitosamente');
    } catch (error: any) {
      logger.error('Error refrescando tokens:', error);

      switch (error.message) {
        case 'INVALID_REFRESH_TOKEN':
          return ApiResponseHandler.unauthorized(res, 'Refresh token inválido o expirado');
        default:
          return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    }
  }

  // Cambiar contraseña
  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      await authService.changePassword(req.user.id, req.body);

      logger.info('Contraseña cambiada exitosamente', {
        userId: req.user.id,
        email: req.user.email
      });

      return ApiResponseHandler.success(res, null, 'Contraseña cambiada exitosamente');
    } catch (error: any) {
      logger.error('Error cambiando contraseña:', error, {
        userId: req.user?.id
      });

      switch (error.message) {
        case 'USER_NOT_FOUND':
          return ApiResponseHandler.notFound(res, 'Usuario no encontrado');
        case 'INVALID_CURRENT_PASSWORD':
          return ApiResponseHandler.error(res, 'Contraseña actual incorrecta', 400);
        default:
          return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    }
  }

  // Logout
  async logout(req: Request, res: Response) {
    try {
      if (req.user) {
        await authService.logout(req.user.id);
      }

      // Limpiar cookies
      this.clearTokenCookies(res);

      logger.info('Logout exitoso', {
        userId: req.user?.id
      });

      return ApiResponseHandler.success(res, null, 'Logout exitoso');
    } catch (error: any) {
      logger.error('Error en logout:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener información del usuario actual
  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      // CORRECCIÓN: Devolver TODOS los campos del usuario, incluido nombre, apellido y avatar
      const userInfo = {
        id: req.user.id,
        email: req.user.email,
        rol: req.user.rol,
        emailVerificado: req.user.emailVerificado,
        perfilCompleto: req.user.perfilCompleto
      };

      return ApiResponseHandler.success(res, userInfo, 'Información del usuario obtenida');
    } catch (error: any) {
      logger.error('Error obteniendo información del usuario:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Verificar estado de autenticación
  async checkAuth(req: Request, res: Response) {
    try {
      const isAuthenticated = !!req.user;

      return ApiResponseHandler.success(res, {
        authenticated: isAuthenticated,
        user: req.user || null
      }, 'Estado de autenticación verificado');
    } catch (error: any) {
      logger.error('Error verificando autenticación:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Métodos auxiliares para manejo de cookies
  private setTokenCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const cookieOptions = {
      httpOnly: true,
      secure: authConfig.session.secure,
      sameSite: authConfig.session.sameSite as boolean | "none" | "lax" | "strict" | undefined,
      domain: undefined, // Se puede configurar para subdominios
      path: '/'
    };

    // Cookie para access token (duración corta)
    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutos
    });

    // Cookie para refresh token (duración larga)
    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
  }

  private clearTokenCookies(res: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: authConfig.session.secure,
      sameSite: authConfig.session.sameSite as boolean | "none" | "lax" | "strict" | undefined,
      path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }
}

export default new AuthController();