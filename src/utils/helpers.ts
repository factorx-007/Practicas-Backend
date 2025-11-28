import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { JwtPayload, TokenPair } from '../types/auth.types';
import { PaginationQuery, PaginationResult } from '../types/common.types';

// Utilidades para passwords
const passwordUtils = {
  // Hash password
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, authConfig.password.saltRounds);
  },

  // Verificar password
  async verify(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  // Validar fortaleza del password
  validateStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = authConfig.password;

    if (password.length < config.minLength) {
      errors.push(`Password debe tener al menos ${config.minLength} caracteres`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password debe contener al menos una letra mayúscula');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password debe contener al menos una letra minúscula');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password debe contener al menos un número');
    }

    if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password debe contener al menos un carácter especial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Utilidades para JWT
const jwtUtils = {
  // Generar access token
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const options: any = {
      expiresIn: authConfig.jwt.accessTokenExpiry,
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    };
    return jwt.sign(payload as object, authConfig.jwt.secret, options);
  },

  // Generar refresh token
  generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const options: any = {
      expiresIn: authConfig.jwt.refreshTokenExpiry,
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    };
    return jwt.sign(payload as object, authConfig.jwt.refreshSecret, options);
  },

  // Generar par de tokens
  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  },

  // Verificar access token
  verifyAccessToken(token: string): JwtPayload {
    const options: jwt.VerifyOptions = {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    };
    return jwt.verify(token, authConfig.jwt.secret, options) as JwtPayload;
  },

  // Verificar refresh token
  verifyRefreshToken(token: string): JwtPayload {
    const options: jwt.VerifyOptions = {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    };
    return jwt.verify(token, authConfig.jwt.refreshSecret, options) as JwtPayload;
  },

  // Decodificar token sin verificar
  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
};

// Utilidades para paginación
const paginationUtils = {
  // Calcular offset y limit
  calculatePagination(query: PaginationQuery) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      offset: Math.max(0, offset),
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc'
    };
  },

  // Crear resultado paginado
  createPaginatedResult<T>(
    data: T[],
    totalItems: number,
    page: number,
    limit: number
  ): PaginationResult<T> {
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
};

// Utilidades para strings
const stringUtils = {
  // Generar slug
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Capitalizar primera letra
  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Generar código aleatorio
  generateRandomCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Sanitizar texto
  sanitize(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }
};

// Utilidades para fechas
const dateUtils = {
  // Agregar días a una fecha
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Agregar horas a una fecha
  addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  // Verificar si una fecha es futura
  isFuture(date: Date): boolean {
    return date > new Date();
  },

  // Verificar si una fecha es pasada
  isPast(date: Date): boolean {
    return date < new Date();
  },

  // Formatear fecha para base de datos
  toISOString(date: Date): string {
    return date.toISOString();
  },

  // Calcular edad
  calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
};

// Utilidades para archivos
const fileUtils = {
  // Obtener extensión de archivo
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  // Verificar si es imagen
  isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  },

  // Verificar si es video
  isVideo(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  },

  // Verificar si es documento
  isDocument(mimetype: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return documentTypes.includes(mimetype);
  },

  // Generar nombre único de archivo
  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const extension = this.getFileExtension(originalName);
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    
    return `${stringUtils.generateSlug(baseName)}-${timestamp}-${random}.${extension}`;
  },

  // Convertir bytes a formato legible
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
};

// Utilidades para validación
const validationUtils = {
  // Validar email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validar URL
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Validar teléfono
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[\d\s\-()]+$/;
    return phoneRegex.test(phone);
  },

  // Validar RUC peruano
  isValidRUC(ruc: string): boolean {
    return /^\d{11}$/.test(ruc);
  }
};

// Exportar todas las utilidades
export {
  passwordUtils,
  jwtUtils,
  paginationUtils,
  stringUtils,
  dateUtils,
  fileUtils,
  validationUtils
};

export default {
  password: passwordUtils,
  jwt: jwtUtils,
  pagination: paginationUtils,
  string: stringUtils,
  date: dateUtils,
  file: fileUtils,
  validation: validationUtils
};