import { UserRole } from './common.types';

// Tipos para JWT
export interface JwtPayload {
  userId: string;
  email: string;
  rol: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Tipos para registro y login
export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: UserRole;
  // Campos opcionales para compatibilidad con frontend
  carrera?: string;
  universidad?: string;
  nombreEmpresa?: string;
  nombreInstitucion?: string;
  // Campos específicos según el rol
  empresa?: {
    ruc: string;
    nombre_empresa: string;
    rubro: string;
    descripcion?: string;
  };
  estudiante?: {
    carrera: string;
    universidad?: string;
    tipo: 'ESTUDIANTE' | 'EGRESADO';
  };
  institucion?: {
    nombre: string;
    tipo: string;
    codigo: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  googleId: string;
  email: string;
  nombre: string;
  apellido: string;
  avatar?: string;
  rol: UserRole;
}

// Tipos para respuestas de autenticación
export interface AuthResponse {
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    avatar?: string;
    rol: UserRole;
    emailVerificado: boolean;
    perfilCompleto: boolean;
  };
  tokens: TokenPair;
}

// Tipos para verificación de email
export interface EmailVerificationRequest {
  token: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

// Tipos para cambio de contraseña
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Tipos para refresh token
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Usuario autenticado en el request
export interface AuthUser {
  id: string;
  email: string;
  rol: UserRole;
  emailVerificado: boolean;
  perfilCompleto: boolean;
}