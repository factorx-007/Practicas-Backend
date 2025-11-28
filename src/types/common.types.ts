import { Request } from 'express';
import { AuthUser } from './auth.types';
import {
  Rol as UserRole,
  TipoEstudiante as StudentType,
  EstadoPostulacion as ApplicationStatus,
  EstadoOferta as OfferStatus,
  ModalidadTrabajo,
  TipoReaccion as ReactionType,
  TipoNotificacion as NotificationType,
  TipoPregunta as QuestionType,
  // --- NUEVOS ENUMS ---
  DisponibilidadTipo,
  TipoInstitucion,
  NivelAcademico,
  SistemaNotas,
  NivelDominio,
  TipoProyecto,
  EstadoProyecto,
  ContextoProyecto,
  TipoCertificacion,
  NivelIdioma,
} from '@prisma/client';

// Tipos comunes para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  details?: any;
}

// Tipos para paginación
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PaginatedResponse<T> extends PaginationResult<T> {}

// Tipos para filtros
export interface BaseFilter {
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface OfferSearchFilters extends BaseFilter {
  ubicacion?: string;
  modalidad?: string;
  tipoEmpleo?: string;
  nivelEducacion?: string;
  experiencia?: string;
  salarioMin?: number;
  salarioMax?: number;
  empresaId?: string;
  activo?: boolean;
}

// Tipos para archivos subidos
export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

// Tipos para errores
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Tipos para request extendido
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Re-exportar Enums de Prisma para consistencia
export {
  UserRole,
  StudentType,
  ApplicationStatus,
  OfferStatus,
  ModalidadTrabajo,
  ReactionType,
  NotificationType,
  QuestionType,
  // --- NUEVOS ENUMS ---
  DisponibilidadTipo,
  TipoInstitucion,
  NivelAcademico,
  SistemaNotas,
  NivelDominio,
  TipoProyecto,
  EstadoProyecto,
  ContextoProyecto,
  TipoCertificacion,
  NivelIdioma,
};