import mongoose from 'mongoose';
import logger from '../utils/logger';

class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB ya está conectado');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;

      if (!mongoUri) {
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
      }

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      logger.info('✅ Conectado exitosamente a MongoDB');

      // Eventos de conexión
      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        logger.warn('❌ MongoDB desconectado');
      });

      mongoose.connection.on('error', (error) => {
        logger.error('❌ Error de conexión MongoDB:', error);
      });

      mongoose.connection.on('reconnected', () => {
        this.isConnected = true;
        logger.info('✅ MongoDB reconectado');
      });

    } catch (error) {
      this.isConnected = false;
      logger.error('❌ Error conectando a MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB desconectado correctamente');
    } catch (error) {
      logger.error('Error desconectando de MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}

// Exportar instancia singleton
export const mongoConnection = MongoDBConnection.getInstance();

// Función helper para conectar
export const connectMongoDB = async (): Promise<void> => {
  await mongoConnection.connect();
};

// Función helper para desconectar
export const disconnectMongoDB = async (): Promise<void> => {
  await mongoConnection.disconnect();
};

export default mongoConnection;