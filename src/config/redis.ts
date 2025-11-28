import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is required');
      }

      // ⚡ OPTIMIZACIÓN: Cliente principal optimizado para bajo uso de memoria
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 60000,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      // ⚡ OPTIMIZACIÓN: Usar duplicate() para pub/sub
      // Comparte el pool de conexiones en lugar de crear conexiones independientes
      this.pubClient = this.client.duplicate();
      this.subClient = this.client.duplicate();

      // Event listeners para el cliente principal
      this.client.on('error', (err: any) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('🔴 Conectando a Redis...');
      });

      this.client.on('ready', () => {
        logger.info('✅ Cliente Redis principal conectado y listo');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('⚠️  Conexión Redis cerrada');
        this.isConnected = false;
      });

      // Event listeners para pub/sub clients
      this.pubClient.on('error', (err: any) => {
        logger.error('Redis pub client error:', err);
      });

      this.subClient.on('error', (err: any) => {
        logger.error('Redis sub client error:', err);
      });

      this.pubClient.on('ready', () => {
        logger.info('✅ Redis Pub client listo');
      });

      this.subClient.on('ready', () => {
        logger.info('✅ Redis Sub client listo');
      });

      // ⚡ OPTIMIZACIÓN: Conectar cliente principal primero, luego duplicados en paralelo
      await this.client.connect();
      logger.info('✅ Cliente Redis principal conectado');

      // Conectar clientes pub/sub en paralelo
      await Promise.all([
        this.pubClient.connect(),
        this.subClient.connect()
      ]);

      // Test de conexión
      await this.client.ping();
      logger.info('🚀 Redis completamente configurado (modo optimizado)');

    } catch (error) {
      logger.error('❌ Error conectando a Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      const promises = [];

      if (this.client?.isOpen) {
        promises.push(this.client.disconnect());
      }

      if (this.pubClient?.isOpen) {
        promises.push(this.pubClient.disconnect());
      }

      if (this.subClient?.isOpen) {
        promises.push(this.subClient.disconnect());
      }

      await Promise.all(promises);

      this.isConnected = false;
      logger.info('✅ Redis desconectado correctamente');
    } catch (error) {
      logger.error('❌ Error desconectando Redis:', error);
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client no está conectado');
    }
    return this.client;
  }

  getPubClient(): RedisClientType {
    if (!this.pubClient) {
      throw new Error('Redis pub client no está configurado');
    }
    return this.pubClient;
  }

  getSubClient(): RedisClientType {
    if (!this.subClient) {
      throw new Error('Redis sub client no está configurado');
    }
    return this.subClient;
  }

  isReady(): boolean {
    return this.isConnected && this.client?.isReady === true;
  }

  // ==================== CACHE HELPERS ====================

  /**
   * Establecer un valor en cache con TTL opcional
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const client = this.getClient();
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, stringValue);
      } else {
        await client.set(key, stringValue);
      }
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Obtener un valor del cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const value = await client.get(key);

      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Eliminar una key del cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Verificar si una key existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result > 0;
    } catch (error) {
      logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Incrementar un contador
   */
  async incr(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.incr(key);
    } catch (error) {
      logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Establecer TTL en una key existente
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.expire(key, seconds);
      return Boolean(result);
    } catch (error) {
      logger.error(`Error setting TTL on key ${key}:`, error);
      return false;
    }
  }

  /**
   * Obtener TTL de una key
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      logger.error(`Error getting TTL of key ${key}:`, error);
      return -1;
    }
  }

  // ==================== SET OPERATIONS ====================

  /**
   * Agregar elementos a un set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const client = this.getClient();
      return await client.sAdd(key, members);
    } catch (error) {
      logger.error(`Error adding to set ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remover elementos de un set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const client = this.getClient();
      return await client.sRem(key, members);
    } catch (error) {
      logger.error(`Error removing from set ${key}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todos los miembros de un set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      const client = this.getClient();
      return await client.sMembers(key);
    } catch (error) {
      logger.error(`Error getting set members ${key}:`, error);
      return [];
    }
  }

  /**
   * Verificar si un elemento está en un set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.sIsMember(key, member);
      return Boolean(result);
    } catch (error) {
      logger.error(`Error checking set membership ${key}:`, error);
      return false;
    }
  }

  // ==================== HASH OPERATIONS ====================

  /**
   * Establecer campos en un hash
   */
  async hset(key: string, field: string, value: any): Promise<number> {
    try {
      const client = this.getClient();
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return await client.hSet(key, field, stringValue);
    } catch (error) {
      logger.error(`Error setting hash field ${key}.${field}:`, error);
      throw error;
    }
  }

  /**
   * Obtener un campo de un hash
   */
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const value = await client.hGet(key, field);

      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      logger.error(`Error getting hash field ${key}.${field}:`, error);
      return null;
    }
  }

  /**
   * Obtener todos los campos de un hash
   */
  async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const result = await client.hGetAll(key);

      if (!result || Object.keys(result).length === 0) return null;

      // Intentar parsear cada valor
      const parsed: any = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }

      return parsed as T;
    } catch (error) {
      logger.error(`Error getting hash ${key}:`, error);
      return null;
    }
  }

  /**
   * Eliminar campos de un hash
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      const client = this.getClient();
      return await client.hDel(key, fields);
    } catch (error) {
      logger.error(`Error deleting hash fields ${key}:`, error);
      throw error;
    }
  }

  // ==================== PATTERN MATCHING ====================

  /**
   * Buscar keys por patrón
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const client = this.getClient();
      return await client.keys(pattern);
    } catch (error) {
      logger.error(`Error searching keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Eliminar keys por patrón (usar con cuidado)
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;

      const client = this.getClient();
      return await client.del(keys);
    } catch (error) {
      logger.error(`Error deleting keys with pattern ${pattern}:`, error);
      return 0;
    }
  }
}

// Singleton instance
export const redisService = RedisService.getInstance();
export default redisService;