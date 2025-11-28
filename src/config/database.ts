import { PrismaClient } from '@prisma/client';

// Instancia global de Prisma
declare global {
  var prisma: PrismaClient | undefined;
}

// ⚡ OPTIMIZACIÓN: Configuración de logs condicional para mejor rendimiento
const getLogLevel = (): Array<'query' | 'error' | 'warn' | 'info'> => {
  const logLevel = process.env.PRISMA_LOG_LEVEL;

  if (logLevel === 'verbose') {
    return ['query', 'error', 'warn', 'info'];
  }

  if (logLevel === 'minimal' || process.env.NODE_ENV === 'development') {
    // En desarrollo: solo errores y warnings 
    return ['error', 'warn'];
  }

  return ['error'];
};

// Crear instancia de Prisma con configuración optimizada
const prisma = global.prisma ||
  new PrismaClient({
    log: getLogLevel(),
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });

// En desarrollo, usar instancia global para evitar múltiples conexiones
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

// Función para conectar a la base de datos
export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

// Función para desconectar de la base de datos
export const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado de la base de datos');
  } catch (error) {
    console.error('❌ Error desconectando de la base de datos:', error);
  }
};

export { prisma };
export default prisma;