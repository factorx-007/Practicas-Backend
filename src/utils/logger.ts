import { Request, Response } from 'express';

// Niveles de log
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Clase Logger simple
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const errorInfo = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined
    } : error;

    const logMessage = this.formatMessage(LogLevel.ERROR, message, { error: errorInfo, ...meta });
    console.error(logMessage);
  }

  warn(message: string, meta?: any): void {
    const logMessage = this.formatMessage(LogLevel.WARN, message, meta);
    console.warn(logMessage);
  }

  info(message: string, meta?: any): void {
    const logMessage = this.formatMessage(LogLevel.INFO, message, meta);
    console.log(logMessage);
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      const logMessage = this.formatMessage(LogLevel.DEBUG, message, meta);
      console.log(logMessage);
    }
  }

  // Log específico para requests HTTP
  http(req: Request, res: Response, responseTime?: number): void {
    const meta = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      userId: (req as any).user?.id || 'anonymous'
    };

    const level = res.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${req.method} ${req.url} - ${res.statusCode}`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, null, meta);
    } else {
      this.info(message, meta);
    }
  }

  // Log para base de datos
  database(operation: string, table: string, duration?: number, error?: Error): void {
    const meta = {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined
    };

    if (error) {
      this.error(`Database ${operation} failed on ${table}`, error, meta);
    } else {
      this.debug(`Database ${operation} on ${table}`, meta);
    }
  }

  // Log para autenticación
  auth(event: string, userId?: string, email?: string, meta?: any): void {
    const authMeta = {
      userId,
      email,
      ...meta
    };

    this.info(`Auth: ${event}`, authMeta);
  }

  // Log para seguridad
  security(event: string, ip: string, meta?: any): void {
    const securityMeta = {
      ip,
      timestamp: new Date().toISOString(),
      ...meta
    };

    this.warn(`Security: ${event}`, securityMeta);
  }
}

// Exportar instancia singleton
export const logger = new Logger();
export default logger;