import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import logger from '../utils/logger';
import {
  CreateNotificationDTO,
  CreateBulkNotificationDTO,
  UpdateNotificationDTO,
  NotificationResponse,
  NotificationQueryParams,
  NotificationsResponse,
  NotificationStats,
  UpdateNotificationSettingsDTO,
  CreateNotificationTemplateDTO,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
} from '../types/notifications.types';
import { NotificationType } from '../types/common.types';

export class NotificationsService {
  async createNotification(data: CreateNotificationDTO): Promise<any> {
    try {
      const notification = await prisma.notificacion.create({
        data: {
          titulo: data.titulo,
          mensaje: data.mensaje,
          tipo: data.tipo,
          usuarioId: data.destinatarioId,
          data: data.metadata,
        },
      });

      logger.info(`Notificación creada: ${notification.id} para usuario: ${data.destinatarioId}`);
      return notification;
    } catch (error) {
      logger.error('Error al crear notificación:', error);
      throw error;
    }
  }

  async createBulkNotifications(data: CreateBulkNotificationDTO): Promise<{ created: number; failed: number }> {
    const results = { created: 0, failed: 0 };
    for (const destinatarioId of data.destinatarioIds) {
      try {
        await this.createNotification({ ...data, destinatarioId });
        results.created++;
      } catch (error) {
        results.failed++;
      }
    }
    return results;
  }

  async getUserNotifications(userId: string, params: NotificationQueryParams): Promise<NotificationsResponse> {
    const { page = 1, limit = 10, ...rest } = params;
    const skip = (page - 1) * limit;
    const where = { usuarioId: userId, ...rest };

    const [notificaciones, total] = await Promise.all([
      prisma.notificacion.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notificacion.count({ where }),
    ]);

    const notificacionesFormateadas = await Promise.all(
      notificaciones.map(notif => this.formatNotification(notif))
    );

    const totalPages = Math.ceil(total / limit);

    return {
      notificaciones: notificacionesFormateadas,
      pagination: {
        total,
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      noLeidas: await prisma.notificacion.count({ where: { usuarioId: userId, leida: false } }),
    };
  }

  async getNotificationById(id: string, userId: string): Promise<any> {
    return prisma.notificacion.findFirst({ where: { id, usuarioId: userId } });
  }

  async updateNotification(id: string, userId: string, data: UpdateNotificationDTO): Promise<any> {
    return prisma.notificacion.update({ where: { id }, data });
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    return prisma.notificacion.update({ where: { id }, data: { leida: true } });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notificacion.updateMany({
      where: { usuarioId: userId, leida: false },
      data: { leida: true },
    });
    return { count: result.count };
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await prisma.notificacion.delete({ where: { id, usuarioId: userId } });
  }

  async getUserNotificationStats(userId: string): Promise<NotificationStats> {
    const [total, noLeidas] = await Promise.all([
      prisma.notificacion.count({ where: { usuarioId: userId } }),
      prisma.notificacion.count({ where: { usuarioId: userId, leida: false } }),
    ]);
    return { total, noLeidas, porTipo: {} as any, porEstado: {} as any, porPrioridad: {} as any, hoy: 0, estaSemana: 0, esteMes: 0 };
  }

  async getUserSettings(userId: string): Promise<any> {
    return {};
  }

  async updateUserSettings(userId: string, data: UpdateNotificationSettingsDTO): Promise<any> {
    return {};
  }

  async createTemplate(data: CreateNotificationTemplateDTO): Promise<any> {
    return {};
  }

  async getActiveTemplates(): Promise<any> {
    return [];
  }

  async cleanExpiredNotifications(): Promise<any> {
    return { deleted: 0 };
  }

  async processScheduledNotifications(): Promise<any> {
    return { processed: 0 };
  }

  private async formatNotification(notificacion: any): Promise<NotificationResponse> {
    return {
      id: notificacion.id,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      tipo: notificacion.tipo,
      destinatarioId: notificacion.usuarioId,
      leida: notificacion.leida,
      fechaCreacion: notificacion.createdAt,
      fechaActualizacion: notificacion.updatedAt,
      metadata: notificacion.data,
      estado: NotificationStatus.SENT, // Add default values for missing properties
      prioridad: NotificationPriority.NORMAL,
      canales: [NotificationChannel.IN_APP],
    };
  }
}
