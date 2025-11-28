import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import app from './app';
import logger from './utils/logger';
import { disconnectDB } from './config/database';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { redisService } from './config/redis';
import { queueService } from './services/queue.service';
import { setupChatSocket } from './socket/chat.socket';
import { setupNotificationsSocket, setNotificationsSocketInstance } from './socket/notifications.socket';
import { getFeatureFlags, logActiveFeatures } from './config/features.config';

// Configuración del puerto
const PORT = process.env.PORT || 5000;

// Crear servidor HTTP
const server = createServer(app);

// Configurar Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ⚡ OPTIMIZACIÓN: Handlers de Socket.IO se configuran condicionalmente según features
let chatHandler: any = null;
let notificationsHandler: any = null;

// Hacer la instancia de io disponible globalmente
declare global {
  var io: SocketIOServer;
}

global.io = io;

// Inicializar servidor con Redis y MongoDB
async function initializeServer() {
  try {
    // ⚡ OPTIMIZACIÓN: Cargar solo las features habilitadas
    const features = getFeatureFlags();
    logActiveFeatures(logger, features);

    // ⚡ OPTIMIZACIÓN: Conexiones paralelas
    logger.info('🔄 Conectando servicios en paralelo...');

    const connections: Promise<any>[] = [
      // PostgreSQL ya se conecta en app.ts
    ];

    if (features.redis) {
      connections.push(redisService.connect());
    }

    if (features.mongodb) {
      connections.push(connectMongoDB());
    }

    await Promise.all(connections);
    logger.info('✅ Todas las bases de datos conectadas');

    // Configurar Redis adapter para Socket.IO clustering (solo si Redis está habilitado)
    if (features.redis) {
      const pubClient = redisService.getPubClient();
      const subClient = redisService.getSubClient();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('✅ Socket.IO Redis adapter configurado');
    }

    // Inicializar colas de trabajos (solo si queues y redis están habilitados)
    if (features.queues && features.redis) {
      await queueService.initialize();
      logger.info('✅ Queue service inicializado');
    }

    // Configurar Socket.IO handlers
    if (features.socketChat) {
      chatHandler = setupChatSocket(io);
      logger.info('✅ Chat Socket handler configurado');
    }

    if (features.socketNotifications) {
      notificationsHandler = setupNotificationsSocket(io);
      setNotificationsSocketInstance(notificationsHandler);
      logger.info('✅ Notifications Socket handler configurado');
    }

    // Iniciar servidor
    server.listen(PORT, () => {
      logger.info(`🚀 Servidor iniciado en puerto ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        timestamp: new Date().toISOString()
      });

      if (process.env.NODE_ENV === 'development') {
        logger.info(`📱 API disponible en: http://localhost:${PORT}`);
        logger.info(`🔧 Health check en: http://localhost:${PORT}/health`);
        logger.info(`📚 API docs en: http://localhost:${PORT}/api`);
        logger.info(`💬 Chat WebSocket configurado`);
        logger.info(`📢 Notifications WebSocket configurado`);
        logger.info(`🔴 Redis clustering habilitado`);
        logger.info(`🔄 Bull Queue procesadores configurados`);
      }
    });
  } catch (error) {
    logger.error('❌ Error inicializando servidor:', error);
    process.exit(1);
  }
}

// Inicializar servidor
initializeServer();

// Manejo de señales del proceso
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  logger.info(`🛑 Recibida señal ${signal}, iniciando cierre graceful...`);
  
  // Cerrar servidor HTTP
  server.close(() => {
    logger.info('✅ Servidor HTTP cerrado');
  });

  // Cerrar conexiones de Socket.IO
  io.close(() => {
    logger.info('✅ Conexiones WebSocket cerradas');
  });

  // Desconectar de las bases de datos, Redis y colas
  try {
    const features = getFeatureFlags();
    const disconnections: Promise<any>[] = [disconnectDB()];

    if (features.mongodb) {
      disconnections.push(disconnectMongoDB());
    }

    if (features.queues && features.redis) {
      disconnections.push(queueService.shutdown());
    }

    if (features.redis) {
      disconnections.push(redisService.disconnect());
    }

    await Promise.all(disconnections);
    logger.info('✅ Bases de datos, colas y Redis desconectados');
  } catch (error) {
    logger.error('❌ Error desconectando servicios:', error);
  }

  // Salir del proceso
  process.exit(0);
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason, {
    promise: promise.toString()
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default server;