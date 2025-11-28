/**
 * ⚡ CONFIGURACIÓN DE FEATURES - Dev Light Mode
 *
 * Permite controlar qué servicios se inician según el modo de desarrollo.
 * Esto optimiza el tiempo de arranque al cargar solo lo necesario.
 */

export interface FeatureFlags {
  redis: boolean;
  mongodb: boolean;
  queues: boolean;
  socketChat: boolean;
  socketNotifications: boolean;
  swagger: boolean;
}

/**
 * Obtiene las feature flags según el modo de desarrollo
 */
export const getFeatureFlags = (): FeatureFlags => {
  const mode = process.env.DEV_MODE || 'full';

  // Perfiles predefinidos
  const profiles: Record<string, FeatureFlags> = {
    // Modo ligero: solo API REST con PostgreSQL (arranque ultra-rápido ~2s)
    light: {
      redis: false,
      mongodb: false,
      queues: false,
      socketChat: false,
      socketNotifications: false,
      swagger: true,
    },

    // Modo API: APIs REST + Redis cache (arranque rápido ~3s)
    api: {
      redis: true,
      mongodb: false,
      queues: false,
      socketChat: false,
      socketNotifications: false,
      swagger: true,
    },

    // Modo chat: para desarrollo de funcionalidades de chat (~5s)
    chat: {
      redis: true,
      mongodb: true,
      queues: false,
      socketChat: true,
      socketNotifications: false,
      swagger: true,
    },

    // Modo completo: todos los servicios (~6s con optimizaciones)
    full: {
      redis: true,
      mongodb: true,
      queues: true,
      socketChat: true,
      socketNotifications: true,
      swagger: true,
    },
  };

  return profiles[mode] || profiles.full;
};

/**
 * Verifica si una feature específica está habilitada
 */
export const isFeatureEnabled = (featureName: keyof FeatureFlags): boolean => {
  const features = getFeatureFlags();
  return features[featureName];
};

/**
 * Obtiene el modo de desarrollo actual
 */
export const getDevMode = (): string => {
  return process.env.DEV_MODE || 'full';
};

/**
 * Loguea las features activas al iniciar el servidor
 */
export const logActiveFeatures = (logger: any, features: FeatureFlags): void => {
  const mode = getDevMode();
  logger.info(`🎯 Modo de desarrollo: ${mode.toUpperCase()}`);
  logger.info('📋 Características activas:');

  Object.entries(features).forEach(([feature, enabled]) => {
    const icon = enabled ? '✅' : '⭕';
    logger.info(`  ${icon} ${feature}`);
  });
};
