import { Response } from 'express';
import { ApiResponse, PaginationResult } from '../types/common.types';

// Clase para respuestas estandarizadas
export class ApiResponseHandler {
  // Respuesta exitosa
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Operación exitosa',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    };
    return res.status(statusCode).json(response);
  }

  // Respuesta exitosa con paginación
  static successWithPagination<T>(
    res: Response,
    paginationResult: PaginationResult<T>,
    message: string = 'Datos obtenidos exitosamente',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<PaginationResult<T>> = {
      success: true,
      message,
      data: paginationResult
    };
    return res.status(statusCode).json(response);
  }

  // Respuesta de error
  static error(
    res: Response,
    message: string = 'Error interno del servidor',
    statusCode: number = 500,
    error?: string,
    errors?: any[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
      errors
    };
    return res.status(statusCode).json(response);
  }

  // Error de validación
  static validationError(
    res: Response,
    errors: any[],
    message: string = 'Errores de validación'
  ): Response {
    return this.error(res, message, 400, undefined, errors);
  }

  // Error de autorización
  static unauthorized(
    res: Response,
    message: string = 'No autorizado'
  ): Response {
    return this.error(res, message, 401);
  }

  // Error de acceso prohibido
  static forbidden(
    res: Response,
    message: string = 'Acceso prohibido'
  ): Response {
    return this.error(res, message, 403);
  }

  // Error de recurso no encontrado
  static notFound(
    res: Response,
    message: string = 'Recurso no encontrado'
  ): Response {
    return this.error(res, message, 404);
  }

  // Error de conflicto
  static conflict(
    res: Response,
    message: string = 'Conflicto en la solicitud'
  ): Response {
    return this.error(res, message, 409);
  }

  // Error de límite de tasa
  static tooManyRequests(
    res: Response,
    message: string = 'Demasiadas solicitudes'
  ): Response {
    return this.error(res, message, 429);
  }

  // Error de límite de tasa con información adicional
  static rateLimitExceeded(
    res: Response,
    message: string = 'Límite de solicitudes excedido',
    details?: { retryAfter?: number; resetTime?: number }
  ): Response {
    const response: ApiResponse<null> = {
      success: false,
      message,
      error: 'RATE_LIMIT_EXCEEDED',
      data: null,
      details
    };
    return res.status(429).json(response);
  }

  // Respuesta de creación exitosa
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Recurso creado exitosamente'
  ): Response {
    return this.success(res, data, message, 201);
  }

  // Respuesta de actualización exitosa
  static updated<T>(
    res: Response,
    data: T,
    message: string = 'Recurso actualizado exitosamente'
  ): Response {
    return this.success(res, data, message, 200);
  }

  // Respuesta de eliminación exitosa
  static deleted(
    res: Response,
    message: string = 'Recurso eliminado exitosamente'
  ): Response {
    return this.success(res, null, message, 200);
  }

  // Respuesta sin contenido
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

// Funciones de utilidad para respuestas rápidas
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode?: number
) => ApiResponseHandler.success(res, data, message, statusCode);

export const sendError = (
  res: Response,
  message?: string,
  statusCode?: number,
  error?: string,
  errors?: any[]
) => ApiResponseHandler.error(res, message, statusCode, error, errors);

export const sendValidationError = (
  res: Response,
  errors: any[],
  message?: string
) => ApiResponseHandler.validationError(res, errors, message);

export const sendUnauthorized = (
  res: Response,
  message?: string
) => ApiResponseHandler.unauthorized(res, message);

export const sendForbidden = (
  res: Response,
  message?: string
) => ApiResponseHandler.forbidden(res, message);

export const sendNotFound = (
  res: Response,
  message?: string
) => ApiResponseHandler.notFound(res, message);

export const sendConflict = (
  res: Response,
  message?: string
) => ApiResponseHandler.conflict(res, message);

export const sendCreated = <T>(
  res: Response,
  data: T,
  message?: string
) => ApiResponseHandler.created(res, data, message);

export const sendUpdated = <T>(
  res: Response,
  data: T,
  message?: string
) => ApiResponseHandler.updated(res, data, message);

export const sendDeleted = (
  res: Response,
  message?: string
) => ApiResponseHandler.deleted(res, message);

export default ApiResponseHandler;