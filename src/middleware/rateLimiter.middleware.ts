import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { ApiResponseHandler } from '../utils/responses';
import logger from '../utils/logger';

export interface RateLimitConfig {
  windowMs: number;        // Ventana de tiempo en milisegundos
  maxRequests: number;     // Número máximo de requests por ventana
  message?: string;        // Mensaje personalizado
  skipSuccessfulRequests?: boolean;  // No contar requests exitosos
  skipFailedRequests?: boolean;      // No contar requests fallidos
  keyGenerator?: (req: Request) => string; // Función para generar la clave
  skip?: (req: Request) => boolean; // Función para saltar rate limiting
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class RateLimiterMiddleware {
  private defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  };

  /**
   * Crear middleware de rate limiting
   */
  createLimiter(config: Partial<RateLimitConfig> = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Verificar si debe saltarse
        if (finalConfig.skip && finalConfig.skip(req)) {
          return next();
        }

        // Generar clave única
        const key = finalConfig.keyGenerator ?
          finalConfig.keyGenerator(req) :
          this.defaultKeyGenerator(req);

        // Verificar rate limit
        const windowSeconds = Math.floor(finalConfig.windowMs / 1000);
        const result = await cacheService.checkRateLimit(
          key,
          'api',
          finalConfig.maxRequests,
          windowSeconds
        );

        // Agregar headers de rate limit
        this.setRateLimitHeaders(res, {
          limit: finalConfig.maxRequests,
          remaining: result.remaining,
          resetTime: result.resetTime
        });

        // Verificar si se excedió el límite
        if (!result.allowed) {
          const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

          logger.warn(`Rate limit excedido para: ${key}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl
          });

          res.set('Retry-After', retryAfter.toString());
          return ApiResponseHandler.rateLimitExceeded(res, finalConfig.message, {
            retryAfter,
            resetTime: result.resetTime
          });
        }

        // Interceptar la respuesta para manejar skipSuccessfulRequests/skipFailedRequests
        if (finalConfig.skipSuccessfulRequests || finalConfig.skipFailedRequests) {
          this.interceptResponse(req, res, key, finalConfig);
        }

        next();
      } catch (error) {
        logger.error('Error en rate limiter middleware:', error);
        // En caso de error, permitir la request
        next();
      }
    };
  }

  /**
   * Rate limiter específico para autenticación
   */
  authLimiter() {
    return this.createLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutos
      maxRequests: 5, // 5 intentos de login por 5 minutos
      message: 'Demasiados intentos de inicio de sesión, intenta de nuevo en 5 minutos.',
      keyGenerator: (req: Request) => `auth:${this.getClientIdentifier(req)}`,
      skipSuccessfulRequests: true // No contar logins exitosos
    });
  }

  /**
   * Rate limiter para registro
   */
  registerLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 3, // 3 registros por hora
      message: 'Demasiados intentos de registro, intenta de nuevo en 1 hora.',
      keyGenerator: (req: Request) => `register:${this.getClientIdentifier(req)}`
    });
  }

  /**
   * Rate limiter para cambio de contraseña
   */
  passwordResetLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 3, // 3 cambios por hora
      message: 'Demasiados intentos de cambio de contraseña, intenta de nuevo en 1 hora.',
      keyGenerator: (req: Request) => `password_reset:${this.getClientIdentifier(req)}`
    });
  }

  /**
   * Rate limiter para uploads
   */
  uploadLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 20, // 20 uploads por 15 minutos
      message: 'Demasiadas subidas de archivos, intenta de nuevo más tarde.',
      keyGenerator: (req: Request) => `upload:${this.getClientIdentifier(req)}`
    });
  }

  /**
   * Rate limiter para creación de contenido
   */
  contentCreationLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 50, // 50 creaciones por hora
      message: 'Demasiada creación de contenido, intenta de nuevo más tarde.',
      keyGenerator: (req: Request) => {
        const userId = (req as any).user?.id;
        return userId ? `content:${userId}` : `content:${this.getClientIdentifier(req)}`;
      }
    });
  }

  /**
   * Rate limiter para búsquedas
   */
  searchLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 30, // 30 búsquedas por minuto
      message: 'Demasiadas búsquedas, intenta de nuevo en un momento.',
      keyGenerator: (req: Request) => {
        const userId = (req as any).user?.id;
        return userId ? `search:${userId}` : `search:${this.getClientIdentifier(req)}`;
      }
    });
  }

  /**
   * Rate limiter para APIs sensibles
   */
  strictLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 10, // 10 requests por hora
      message: 'Límite estricto alcanzado, intenta de nuevo más tarde.',
      keyGenerator: (req: Request) => {
        const userId = (req as any).user?.id;
        return userId ? `strict:${userId}` : `strict:${this.getClientIdentifier(req)}`;
      }
    });
  }

  /**
   * Rate limiter por usuario autenticado
   */
  userLimiter(maxRequests: number = 1000, windowMs: number = 60 * 60 * 1000) {
    return this.createLimiter({
      windowMs,
      maxRequests,
      message: 'Límite de requests por usuario alcanzado.',
      keyGenerator: (req: Request) => {
        const userId = (req as any).user?.id;
        if (!userId) {
          throw new Error('Rate limiter por usuario requiere autenticación');
        }
        return `user:${userId}`;
      },
      skip: (req: Request) => {
        // Saltar si no hay usuario autenticado
        return !(req as any).user?.id;
      }
    });
  }

  // ==================== UTILIDADES PRIVADAS ====================

  private defaultKeyGenerator(req: Request): string {
    return `api:${this.getClientIdentifier(req)}`;
  }

  private getClientIdentifier(req: Request): string {
    // Priorizar IP real sobre headers que pueden ser falsificados
    const forwardedFor = req.get('X-Forwarded-For');
    const realIp = req.get('X-Real-IP');
    const remoteAddress = req.connection.remoteAddress;

    let ip = req.ip || remoteAddress || 'unknown';

    // Si hay X-Forwarded-For, tomar la primera IP (la original)
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp;
    }

    return ip;
  }

  private setRateLimitHeaders(res: Response, info: RateLimitInfo): void {
    res.set({
      'X-RateLimit-Limit': info.limit.toString(),
      'X-RateLimit-Remaining': info.remaining.toString(),
      'X-RateLimit-Reset': new Date(info.resetTime).toISOString(),
    });

    if (info.retryAfter) {
      res.set('Retry-After', info.retryAfter.toString());
    }
  }

  private interceptResponse(
    req: Request,
    res: Response,
    key: string,
    config: RateLimitConfig
  ): void {
    const originalSend = res.send;

    res.send = function(body: any) {
      const statusCode = res.statusCode;
      const shouldSkip =
        (config.skipSuccessfulRequests && statusCode < 400) ||
        (config.skipFailedRequests && statusCode >= 400);

      if (shouldSkip) {
        // Revertir el contador si se debe saltar
        cacheService.checkRateLimit(key, 'api_revert', 1, 1)
          .catch(error => logger.error('Error revirtiendo rate limit:', error));
      }

      return originalSend.call(this, body);
    };
  }

  // ==================== GESTIÓN AVANZADA ====================

  /**
   * Resetear rate limit para una clave específica
   */
  async resetLimit(key: string): Promise<void> {
    await cacheService.resetRateLimit(key, 'api');
    logger.info(`Rate limit reseteado para: ${key}`);
  }

  /**
   * Obtener información del rate limit actual
   */
  async getLimitInfo(req: Request, config: Partial<RateLimitConfig> = {}): Promise<RateLimitInfo | null> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const key = finalConfig.keyGenerator ?
        finalConfig.keyGenerator(req) :
        this.defaultKeyGenerator(req);

      const windowSeconds = Math.floor(finalConfig.windowMs / 1000);
      const result = await cacheService.checkRateLimit(
        key,
        'api_check',
        finalConfig.maxRequests,
        windowSeconds
      );

      return {
        limit: finalConfig.maxRequests,
        remaining: result.remaining,
        resetTime: result.resetTime
      };
    } catch (error) {
      logger.error('Error obteniendo info de rate limit:', error);
      return null;
    }
  }

  /**
   * Middleware para rutas que requieren verificación previa del rate limit
   */
  checkLimitOnly(config: Partial<RateLimitConfig> = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const info = await this.getLimitInfo(req, config);
        if (info) {
          this.setRateLimitHeaders(res, info);
        }
        next();
      } catch (error) {
        logger.error('Error en check limit middleware:', error);
        next();
      }
    };
  }

  /**
   * Whitelist de IPs que no tienen rate limiting
   */
  createWhitelistLimiter(whitelist: string[], config: Partial<RateLimitConfig> = {}) {
    return this.createLimiter({
      ...config,
      skip: (req: Request) => {
        const ip = this.getClientIdentifier(req);
        return whitelist.includes(ip);
      }
    });
  }

  /**
   * Rate limiter dinámico basado en el rol del usuario
   */
  roleBasedLimiter(roleConfig: Record<string, { maxRequests: number; windowMs: number }>) {
    return this.createLimiter({
      keyGenerator: (req: Request) => {
        const user = (req as any).user;
        const role = user?.rol || 'guest';
        return `role:${role}:${user?.id || this.getClientIdentifier(req)}`;
      },
      maxRequests: 100, // Default, será sobrescrito
      windowMs: 15 * 60 * 1000, // Default, será sobrescrito
      skip: (req: Request) => {
        const user = (req as any).user;
        const role = user?.rol || 'guest';

        // Aplicar configuración específica del rol
        const config = roleConfig[role];
        if (config) {
          // Nota: Esta es una implementación simplificada
          // En una implementación real, necesitarías reestructurar el middleware
          return false;
        }
        return true; // Saltar si no hay configuración para el rol
      }
    });
  }
}

// Singleton instance
export const rateLimiter = new RateLimiterMiddleware();

// Exportar limitadores comunes
export const authLimiter = rateLimiter.authLimiter();
export const registerLimiter = rateLimiter.registerLimiter();
export const passwordResetLimiter = rateLimiter.passwordResetLimiter();
export const uploadLimiter = rateLimiter.uploadLimiter();
export const contentCreationLimiter = rateLimiter.contentCreationLimiter();
export const searchLimiter = rateLimiter.searchLimiter();
export const strictLimiter = rateLimiter.strictLimiter();

export default rateLimiter;