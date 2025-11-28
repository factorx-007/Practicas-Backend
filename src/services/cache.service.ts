import { redisService } from '../config/redis';
import logger from '../utils/logger';
import { UserRole } from '../types/common.types';

export interface CacheConfig {
  defaultTTL: number;
  keyPrefix: string;
}

export interface UserCacheData {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  avatar?: string;
  configuracionPrivacidad: any;
  verificado: boolean;
  activo: boolean;
}

export interface UserStatsCache {
  followers: number;
  following: number;
  posts: number;
  ofertas?: number;
  postulaciones?: number;
}

export interface NotificationStatsCache {
  unread: number;
  lastNotification?: Date;
}

class CacheService {
  private readonly config: CacheConfig = {
    defaultTTL: 3600, // 1 hora
    keyPrefix: 'protalent:'
  };

  // ==================== KEY GENERATION ====================

  private getKey(namespace: string, identifier: string): string {
    return `${this.config.keyPrefix}${namespace}:${identifier}`;
  }

  getUserKey(userId: string): string {
    return this.getKey('user', userId);
  }

  getUserStatsKey(userId: string): string {
    return this.getKey('user:stats', userId);
  }

  getNotificationStatsKey(userId: string): string {
    return this.getKey('notifications:stats', userId);
  }

  getOfferKey(offerId: string): string {
    return this.getKey('offer', offerId);
  }

  getPostKey(postId: string): string {
    return this.getKey('post', postId);
  }

  getChatKey(conversationId: string): string {
    return this.getKey('chat', conversationId);
  }

  getSessionKey(userId: string): string {
    return this.getKey('session', userId);
  }

  getRateLimitKey(identifier: string, action: string): string {
    return this.getKey('ratelimit', `${identifier}:${action}`);
  }

  getSearchKey(query: string, filters: string): string {
    const hash = Buffer.from(`${query}:${filters}`).toString('base64');
    return this.getKey('search', hash);
  }

  // ==================== USER CACHE ====================

  async cacheUser(userId: string, userData: UserCacheData, ttl?: number): Promise<void> {
    try {
      const key = this.getUserKey(userId);
      await redisService.set(key, userData, ttl || this.config.defaultTTL);
      logger.debug(`Usuario cacheado: ${userId}`);
    } catch (error) {
      logger.error(`Error cacheando usuario ${userId}:`, error);
    }
  }

  async getUser(userId: string): Promise<UserCacheData | null> {
    try {
      const key = this.getUserKey(userId);
      return await redisService.get<UserCacheData>(key);
    } catch (error) {
      logger.error(`Error obteniendo usuario del cache ${userId}:`, error);
      return null;
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    try {
      const key = this.getUserKey(userId);
      await redisService.del(key);
      logger.debug(`Cache de usuario invalidado: ${userId}`);
    } catch (error) {
      logger.error(`Error invalidando cache de usuario ${userId}:`, error);
    }
  }

  // ==================== USER STATS CACHE ====================

  async cacheUserStats(userId: string, stats: UserStatsCache, ttl?: number): Promise<void> {
    try {
      const key = this.getUserStatsKey(userId);
      await redisService.set(key, stats, ttl || 1800); // 30 minutos para stats
      logger.debug(`Stats de usuario cacheadas: ${userId}`);
    } catch (error) {
      logger.error(`Error cacheando stats de usuario ${userId}:`, error);
    }
  }

  async getUserStats(userId: string): Promise<UserStatsCache | null> {
    try {
      const key = this.getUserStatsKey(userId);
      return await redisService.get<UserStatsCache>(key);
    } catch (error) {
      logger.error(`Error obteniendo stats del cache ${userId}:`, error);
      return null;
    }
  }

  async invalidateUserStats(userId: string): Promise<void> {
    try {
      const key = this.getUserStatsKey(userId);
      await redisService.del(key);
      logger.debug(`Cache de stats de usuario invalidado: ${userId}`);
    } catch (error) {
      logger.error(`Error invalidando cache de stats ${userId}:`, error);
    }
  }

  async incrementUserStat(userId: string, stat: keyof UserStatsCache, increment: number = 1): Promise<void> {
    try {
      const key = this.getUserStatsKey(userId);
      const stats = await this.getUserStats(userId);

      if (stats) {
        (stats[stat] as number) = ((stats[stat] as number) || 0) + increment;
        await this.cacheUserStats(userId, stats);
      }
    } catch (error) {
      logger.error(`Error incrementando stat ${stat} para usuario ${userId}:`, error);
    }
  }

  // ==================== NOTIFICATION STATS CACHE ====================

  async cacheNotificationStats(userId: string, stats: NotificationStatsCache, ttl?: number): Promise<void> {
    try {
      const key = this.getNotificationStatsKey(userId);
      await redisService.set(key, stats, ttl || 300); // 5 minutos para notificaciones
      logger.debug(`Stats de notificaciones cacheadas: ${userId}`);
    } catch (error) {
      logger.error(`Error cacheando stats de notificaciones ${userId}:`, error);
    }
  }

  async getNotificationStats(userId: string): Promise<NotificationStatsCache | null> {
    try {
      const key = this.getNotificationStatsKey(userId);
      return await redisService.get<NotificationStatsCache>(key);
    } catch (error) {
      logger.error(`Error obteniendo stats de notificaciones ${userId}:`, error);
      return null;
    }
  }

  async invalidateNotificationStats(userId: string): Promise<void> {
    try {
      const key = this.getNotificationStatsKey(userId);
      await redisService.del(key);
      logger.debug(`Cache de stats de notificaciones invalidado: ${userId}`);
    } catch (error) {
      logger.error(`Error invalidando cache de notificaciones ${userId}:`, error);
    }
  }

  // ==================== SESSION CACHE ====================

  async cacheUserSession(userId: string, sessionData: any, ttl?: number): Promise<void> {
    try {
      const key = this.getSessionKey(userId);
      await redisService.set(key, sessionData, ttl || 86400); // 24 horas
      logger.debug(`Sesión cacheada: ${userId}`);
    } catch (error) {
      logger.error(`Error cacheando sesión ${userId}:`, error);
    }
  }

  async getUserSession(userId: string): Promise<any | null> {
    try {
      const key = this.getSessionKey(userId);
      return await redisService.get(key);
    } catch (error) {
      logger.error(`Error obteniendo sesión ${userId}:`, error);
      return null;
    }
  }

  async invalidateUserSession(userId: string): Promise<void> {
    try {
      const key = this.getSessionKey(userId);
      await redisService.del(key);
      logger.debug(`Sesión invalidada: ${userId}`);
    } catch (error) {
      logger.error(`Error invalidando sesión ${userId}:`, error);
    }
  }

  // ==================== RATE LIMITING ====================

  async checkRateLimit(identifier: string, action: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = this.getRateLimitKey(identifier, action);
      const current = await redisService.incr(key);

      if (current === 1) {
        // Primera request en la ventana, establecer TTL
        await redisService.expire(key, windowSeconds);
      }

      const ttl = await redisService.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      };
    } catch (error) {
      logger.error(`Error verificando rate limit ${identifier}:${action}:`, error);
      // En caso de error, permitir la request
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + (windowSeconds * 1000) };
    }
  }

  async resetRateLimit(identifier: string, action: string): Promise<void> {
    try {
      const key = this.getRateLimitKey(identifier, action);
      await redisService.del(key);
    } catch (error) {
      logger.error(`Error reseteando rate limit ${identifier}:${action}:`, error);
    }
  }

  // ==================== SEARCH CACHE ====================

  async cacheSearchResults(query: string, filters: any, results: any[], ttl?: number): Promise<void> {
    try {
      const filtersStr = JSON.stringify(filters);
      const key = this.getSearchKey(query, filtersStr);
      await redisService.set(key, {
        query,
        filters,
        results,
        timestamp: new Date()
      }, ttl || 600); // 10 minutos para búsquedas
    } catch (error) {
      logger.error(`Error cacheando resultados de búsqueda:`, error);
    }
  }

  async getSearchResults(query: string, filters: any): Promise<any[] | null> {
    try {
      const filtersStr = JSON.stringify(filters);
      const key = this.getSearchKey(query, filtersStr);
      const cached = await redisService.get(key);
      return cached ? cached.results : null;
    } catch (error) {
      logger.error(`Error obteniendo resultados de búsqueda del cache:`, error);
      return null;
    }
  }

  // ==================== BULK OPERATIONS ====================

  async invalidateUserRelatedCache(userId: string): Promise<void> {
    try {
      const patterns = [
        this.getUserKey(userId),
        this.getUserStatsKey(userId),
        this.getNotificationStatsKey(userId),
        this.getSessionKey(userId)
      ];

      await Promise.all(patterns.map(key => redisService.del(key)));
      logger.debug(`Cache relacionado al usuario invalidado: ${userId}`);
    } catch (error) {
      logger.error(`Error invalidando cache relacionado al usuario ${userId}:`, error);
    }
  }

  async warmUpUserCache(userId: string, userData: UserCacheData, stats: UserStatsCache): Promise<void> {
    try {
      await Promise.all([
        this.cacheUser(userId, userData),
        this.cacheUserStats(userId, stats)
      ]);
      logger.debug(`Cache precargado para usuario: ${userId}`);
    } catch (error) {
      logger.error(`Error precargando cache para usuario ${userId}:`, error);
    }
  }

  // ==================== UTILITIES ====================

  async flushAll(): Promise<void> {
    try {
      const pattern = `${this.config.keyPrefix}*`;
      await redisService.deletePattern(pattern);
      logger.warn('Todo el cache de la aplicación ha sido limpiado');
    } catch (error) {
      logger.error('Error limpiando cache completo:', error);
    }
  }

  async getStats(): Promise<any> {
    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await redisService.keys(pattern);

      const stats = {
        totalKeys: keys.length,
        keysByNamespace: {} as Record<string, number>
      };

      keys.forEach(key => {
        const namespace = key.split(':')[1] || 'unknown';
        stats.keysByNamespace[namespace] = (stats.keysByNamespace[namespace] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas del cache:', error);
      return { totalKeys: 0, keysByNamespace: {} };
    }
  }

  async healthCheck(): Promise<{ status: string; latency: number }> {
    try {
      const start = Date.now();
      const testKey = `${this.config.keyPrefix}health:${Date.now()}`;

      await redisService.set(testKey, 'test', 1);
      const value = await redisService.get(testKey);
      await redisService.del(testKey);

      const latency = Date.now() - start;

      return {
        status: value === 'test' ? 'healthy' : 'unhealthy',
        latency
      };
    } catch (error) {
      logger.error('Error en health check del cache:', error);
      return {
        status: 'unhealthy',
        latency: -1
      };
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
export default cacheService;