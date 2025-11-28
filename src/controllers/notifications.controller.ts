import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponseHandler } from '../utils/responses';
import logger from '../utils/logger';
import { NotificationsService } from '../services/notifications.service';
import { AuthenticatedRequest } from '../types/common.types';
import {
  CreateNotificationDTO,
  CreateBulkNotificationDTO,
  UpdateNotificationDTO,
  NotificationQueryParams,
  UpdateNotificationSettingsDTO,
  CreateNotificationTemplateDTO
} from '../types/notifications.types';

const notificationsService = new NotificationsService();

class NotificationsController {
  // ==================== NOTIFICACIONES ====================

  /**
   * Crear una nueva notificación
   */
  async createNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const createData: CreateNotificationDTO = req.body;
      // Si no se especifica remitente, usar el usuario autenticado
      if (!createData.remitenteId && req.user) {
        createData.remitenteId = req.user.id;
      }

      const nuevaNotificacion = await notificationsService.createNotification(createData);

      logger.info(`Notificación creada: ${nuevaNotificacion.id} por usuario ${req.user?.id}`);
      return ApiResponseHandler.created(res, nuevaNotificacion, 'Notificación creada exitosamente');

    } catch (error: any) {
      logger.error('Error al crear notificación:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Crear notificaciones masivas
   */
  async createBulkNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const createData: CreateBulkNotificationDTO = req.body;
      // Si no se especifica remitente, usar el usuario autenticado
      if (!createData.remitenteId && req.user) {
        createData.remitenteId = req.user.id;
      }

      const resultado = await notificationsService.createBulkNotifications(createData);

      logger.info(`Notificaciones masivas creadas por usuario ${req.user?.id}: ${resultado.created} exitosas, ${resultado.failed} fallidas`);
      return ApiResponseHandler.success(res, resultado, 'Notificaciones masivas creadas');

    } catch (error: any) {
      logger.error('Error al crear notificaciones masivas:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener notificaciones del usuario autenticado
   */
  async getMyNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const queryParams: NotificationQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        tipo: req.query.tipo as any,
        estado: req.query.estado as any,
        prioridad: req.query.prioridad as any,
        leida: req.query.leida === 'true' ? true : req.query.leida === 'false' ? false : undefined,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        remitenteId: req.query.remitenteId as string,
        busqueda: req.query.busqueda as string,
        orderBy: req.query.orderBy as any,
        order: req.query.order as any
      };

      const notificaciones = await notificationsService.getUserNotifications(userId, queryParams);

      return ApiResponseHandler.success(res, notificaciones, 'Notificaciones obtenidas exitosamente');

    } catch (error: any) {
      logger.error(`Error al obtener notificaciones del usuario ${req.user?.id}:`, error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener una notificación específica
   */
  async getNotificationById(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const { id } = req.params;

      const notificacion = await notificationsService.getNotificationById(id, userId);

      return ApiResponseHandler.success(res, notificacion, 'Notificación obtenida exitosamente');

    } catch (error: any) {
      logger.error(`Error al obtener notificación ${req.params.id}:`, error);
      if (error.message === 'Notificación no encontrada') {
        return ApiResponseHandler.error(res, error.message, 404);
      }
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Actualizar una notificación
   */
  async updateNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const { id } = req.params;
      const updateData: UpdateNotificationDTO = req.body;

      const notificacionActualizada = await notificationsService.updateNotification(id, userId, updateData);

      logger.info(`Notificación actualizada: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, notificacionActualizada, 'Notificación actualizada exitosamente');

    } catch (error: any) {
      logger.error(`Error al actualizar notificación ${req.params.id}:`, error);
      if (error.message === 'Notificación no encontrada') {
        return ApiResponseHandler.error(res, error.message, 404);
      }
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const { id } = req.params;

      const notificacionActualizada = await notificationsService.markAsRead(id, userId);

      logger.info(`Notificación marcada como leída: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, notificacionActualizada, 'Notificación marcada como leída');

    } catch (error: any) {
      logger.error(`Error al marcar notificación como leída ${req.params.id}:`, error);
      if (error.message === 'Notificación no encontrada') {
        return ApiResponseHandler.error(res, error.message, 404);
      }
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const resultado = await notificationsService.markAllAsRead(userId);

      logger.info(`Todas las notificaciones marcadas como leídas para usuario ${userId}`);
      return ApiResponseHandler.success(res, resultado, 'Todas las notificaciones marcadas como leídas');

    } catch (error: any) {
      logger.error(`Error al marcar todas las notificaciones como leídas para usuario ${req.user?.id}:`, error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const { id } = req.params;

      await notificationsService.deleteNotification(id, userId);

      logger.info(`Notificación eliminada: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, null, 'Notificación eliminada exitosamente');

    } catch (error: any) {
      logger.error(`Error al eliminar notificación ${req.params.id}:`, error);
      if (error.message === 'Notificación no encontrada') {
        return ApiResponseHandler.error(res, error.message, 404);
      }
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener estadísticas de notificaciones del usuario
   */
  async getNotificationStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const estadisticas = await notificationsService.getUserNotificationStats(userId);

      return ApiResponseHandler.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');

    } catch (error: any) {
      logger.error(`Error al obtener estadísticas de notificaciones para usuario ${req.user?.id}:`, error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // ==================== CONFIGURACIÓN ====================

  /**
   * Obtener configuración de notificaciones del usuario
   */
  async getNotificationSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const configuracion = await notificationsService.getUserSettings(userId);

      return ApiResponseHandler.success(res, configuracion, 'Configuración obtenida exitosamente');

    } catch (error: any) {
      logger.error(`Error al obtener configuración de notificaciones para usuario ${req.user?.id}:`, error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Actualizar configuración de notificaciones del usuario
   */
  async updateNotificationSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const updateData: UpdateNotificationSettingsDTO = req.body;

      const configuracionActualizada = await notificationsService.updateUserSettings(userId, updateData);

      logger.info(`Configuración de notificaciones actualizada para usuario ${userId}`);
      return ApiResponseHandler.success(res, configuracionActualizada, 'Configuración actualizada exitosamente');

    } catch (error: any) {
      logger.error(`Error al actualizar configuración de notificaciones para usuario ${req.user?.id}:`, error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // ==================== TEMPLATES (ADMIN) ====================

  /**
   * Crear un template de notificación
   */
  async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      // Verificar que el usuario sea admin
      if (req.user?.rol !== 'ADMIN') {
        return ApiResponseHandler.error(res, 'No tienes permisos para realizar esta acción', 403);
      }

      const createData: CreateNotificationTemplateDTO = req.body;

      const nuevoTemplate = await notificationsService.createTemplate(createData);

      logger.info(`Template de notificación creado: ${nuevoTemplate.id} por admin ${req.user.id}`);
      return ApiResponseHandler.created(res, nuevoTemplate, 'Template creado exitosamente');

    } catch (error: any) {
      logger.error('Error al crear template de notificación:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener templates activos
   */
  async getActiveTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      // Verificar que el usuario sea admin
      if (req.user?.rol !== 'ADMIN') {
        return ApiResponseHandler.error(res, 'No tienes permisos para realizar esta acción', 403);
      }

      const templates = await notificationsService.getActiveTemplates();

      return ApiResponseHandler.success(res, templates, 'Templates obtenidos exitosamente');

    } catch (error: any) {
      logger.error('Error al obtener templates activos:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // ==================== ADMINISTRACIÓN ====================

  /**
   * Limpiar notificaciones expiradas
   */
  async cleanExpiredNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      // Verificar que el usuario sea admin
      if (req.user?.rol !== 'ADMIN') {
        return ApiResponseHandler.error(res, 'No tienes permisos para realizar esta acción', 403);
      }

      const resultado = await notificationsService.cleanExpiredNotifications();

      logger.info(`Notificaciones expiradas limpiadas por admin ${req.user.id}: ${resultado.deleted} eliminadas`);
      return ApiResponseHandler.success(res, resultado, 'Notificaciones expiradas limpiadas exitosamente');

    } catch (error: any) {
      logger.error('Error al limpiar notificaciones expiradas:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Procesar notificaciones programadas
   */
  async processScheduledNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      // Verificar que el usuario sea admin
      if (req.user?.rol !== 'ADMIN') {
        return ApiResponseHandler.error(res, 'No tienes permisos para realizar esta acción', 403);
      }

      const resultado = await notificationsService.processScheduledNotifications();

      logger.info(`Notificaciones programadas procesadas por admin ${req.user.id}: ${resultado.processed} procesadas`);
      return ApiResponseHandler.success(res, resultado, 'Notificaciones programadas procesadas exitosamente');

    } catch (error: any) {
      logger.error('Error al procesar notificaciones programadas:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtener conteo de notificaciones no leídas (para uso en otros controladores)
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const estadisticas = await notificationsService.getUserNotificationStats(userId);

      return ApiResponseHandler.success(res, { count: estadisticas.noLeidas }, 'Conteo obtenido exitosamente');

    } catch (error: any) {
      logger.error(`Error al obtener conteo de notificaciones no leídas para usuario ${req.user?.id}:`, error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Webhook para notificaciones externas (ejemplo: email, push)
   */
  async handleExternalNotificationWebhook(req: Request, res: Response) {
    try {
      const { notificationId, status, error } = req.body;

      // Aquí se podría actualizar el estado de la notificación según el webhook
      logger.info(`Webhook de notificación externa recibido: ${notificationId} - ${status}`);

      return ApiResponseHandler.success(res, null, 'Webhook procesado exitosamente');

    } catch (error: any) {
      logger.error('Error al procesar webhook de notificación externa:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }
}

export default new NotificationsController();