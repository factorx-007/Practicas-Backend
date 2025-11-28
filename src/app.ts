import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { rateLimiter } from './middleware/rateLimiter.middleware';
import dotenv from 'dotenv';
import path from 'path';

import { connectDB } from './config/database';
import logger from './utils/logger';
import { ApiResponseHandler } from './utils/responses';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();

// Configuración de CORS
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://practicas-frontend.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Configuración de Rate Limiting basado en Redis
const apiLimiter = rateLimiter.createLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // máximo 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  skip: (req: Request) => {
    // Excluir endpoints de salud de rate limiting
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Middleware básico
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use((req, res, next) => {
  // Si el content-type es multipart/form-data, saltar el middleware de JSON
  if (req.is('multipart/form-data')) {
    return next();
  }
  return express.json({ limit: '10mb' })(req, res, next);
});
// NOTE: urlencoded middleware can interfere with JSON parsing for nested objects
// Only apply urlencoded for specific routes that need it
app.use('/api/uploads', express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting basado en Redis
app.use('/api', apiLimiter);

// Logging HTTP requests
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));


// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Endpoint de salud
app.get('/health', (req: Request, res: Response) => {
  ApiResponseHandler.success(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }, 'Servidor funcionando correctamente');
});

// Importar configuración de Swagger
import { setupSwagger } from './config/swagger';

// Importar rutas
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import offersRoutes from './routes/offers.routes';
import socialRoutes from './routes/social.routes';
import chatRoutes from './routes/chat.routes';
import notificationsRoutes from './routes/notifications.routes';
import adminRoutes from './routes/admin.routes';
import catalogsRoutes from './routes/catalogs.routes';

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/catalogs', catalogsRoutes);

// Configurar Swagger UI
setupSwagger(app);

// Ruta raíz
app.get('/', (req: Request, res: Response) => {
  ApiResponseHandler.success(res, {
    name: 'ProTalent API',
    version: '1.0.0',
    description: 'API Backend para la plataforma ProTalent',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      offers: '/api/offers',
      social: '/api/social',
      chat: '/api/chat',
      notifications: '/api/notifications',
      admin: '/api/admin'
    },
    documentation: {
      swagger: '/api-docs',
      json: '/api-docs.json'
    }
  }, 'Bienvenido a ProTalent API');
});

// Middleware para rutas no encontradas
app.use((req: Request, res: Response) => {
  ApiResponseHandler.notFound(res, `Ruta ${req.originalUrl} no encontrada`);
});

// Middleware global de manejo de errores
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error no manejado:', error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Error de validación de express-validator
  if (error.type === 'validation') {
    return ApiResponseHandler.validationError(res, error.errors);
  }

  // Error de JWT
  if (error.name === 'JsonWebTokenError') {
    return ApiResponseHandler.unauthorized(res, 'Token inválido');
  }

  if (error.name === 'TokenExpiredError') {
    return ApiResponseHandler.unauthorized(res, 'Token expirado');
  }

  // Error de Prisma
  if (error.code === 'P2002') {
    return ApiResponseHandler.conflict(res, 'Ya existe un registro con estos datos');
  }

  if (error.code === 'P2025') {
    return ApiResponseHandler.notFound(res, 'Registro no encontrado');
  }

  // Error de Multer (archivos)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return ApiResponseHandler.error(res, 'Archivo demasiado grande', 413);
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return ApiResponseHandler.error(res, 'Tipo de archivo no permitido', 415);
  }

  // Error interno del servidor
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : error.message;

  ApiResponseHandler.error(res, message, statusCode);
});

// Conectar a la base de datos
connectDB().catch((error) => {
  logger.error('Error conectando a la base de datos al iniciar:', error);
  process.exit(1);
});

export default app;