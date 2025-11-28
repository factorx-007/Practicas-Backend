import { Server, Socket } from 'socket.io';
import { jwtUtils } from '../utils/helpers';
import logger from '../utils/logger';
import { NotificationsService } from '../services/notifications.service';
import {
  NotificationSocketEvents,
  NotificationSocketContext,
  CreateNotificationDTO
} from '../types/notifications.types';

// Estado global del servidor de notificaciones
const usuariosConectados = new Map<string, NotificationSocketContext>();
const notificationsService = new NotificationsService();

export class NotificationsSocketHandler {
  private io: Server;
  private notificationsNamespace: any;

  constructor(io: Server) {
    this.io = io;
    this.setupNamespace();
  }

  private setupNamespace(): void {
    // Crear namespace específico para notificaciones
    this.notificationsNamespace = this.io.of('/notifications');

    this.notificationsNamespace.on('connection', (socket: Socket) => {
      logger.info(`Cliente conectado a notificaciones: ${socket.id}`);

      // Autenticar usuario al conectar
      this.authenticateUser(socket);

      // Configurar eventos del socket
      this.setupEventHandlers(socket);

      // Manejar desconexión
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async authenticateUser(socket: Socket): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        logger.warn(`Conexión de notificaciones rechazada - No token: ${socket.id}`);
        socket.emit('notification_error', { message: 'Token de autenticación requerido' });
        socket.disconnect();
        return;
      }

      const payload = jwtUtils.verifyAccessToken(token);

      if (!payload) {
        logger.warn(`Conexión de notificaciones rechazada - Token inválido: ${socket.id}`);
        socket.emit('notification_error', { message: 'Token inválido' });
        socket.disconnect();
        return;
      }

      // Agregar información del usuario al socket
      socket.data.userId = payload.userId;
      socket.data.userEmail = payload.email;

      // Registrar usuario como conectado
      this.registerUserConnected(payload.userId, socket.id, socket);

      logger.info(`Usuario conectado a notificaciones: ${payload.userId} (${socket.id})`);

      // Enviar estadísticas iniciales al conectar
      await this.sendNotificationStats(socket, payload.userId);

    } catch (error) {
      logger.error('Error autenticando usuario en notificaciones:', error);
      socket.emit('notification_error', { message: 'Error de autenticación' });
      socket.disconnect();
    }
  }

  private setupEventHandlers(socket: Socket): void {
    // Unirse al canal de notificaciones
    socket.on('join_notifications', () => {
      this.handleJoinNotifications(socket);
    });

    // Salir del canal de notificaciones
    socket.on('leave_notifications', () => {
      this.handleLeaveNotifications(socket);
    });

    // Marcar notificación como leída
    socket.on('mark_notification_read', async (notificationId: string) => {
      await this.handleMarkNotificationRead(socket, notificationId);
    });

    // Marcar todas las notificaciones como leídas
    socket.on('mark_all_notifications_read', async () => {
      await this.handleMarkAllNotificationsRead(socket);
    });

    // Eliminar notificación
    socket.on('delete_notification', async (notificationId: string) => {
      await this.handleDeleteNotification(socket, notificationId);
    });

    // Solicitar estadísticas actualizadas
    socket.on('request_notification_stats', async () => {
      await this.sendNotificationStats(socket, socket.data.userId);
    });
  }

  private registerUserConnected(userId: string, socketId: string, socket: Socket): void {
    const context: NotificationSocketContext = {
      userId,
      socketId,
      joinedNotifications: false,
      lastActivity: new Date(),
      userAgent: socket.handshake.headers['user-agent'],
      ipAddress: socket.handshake.address
    };

    usuariosConectados.set(userId, context);
  }

  private handleJoinNotifications(socket: Socket): void {
    try {
      const userId = socket.data.userId;

      // Unirse a la sala personal de notificaciones
      socket.join(`notifications_${userId}`);

      // Actualizar estado
      const usuario = usuariosConectados.get(userId);
      if (usuario) {
        usuario.joinedNotifications = true;
        usuario.lastActivity = new Date();
      }

      logger.info(`Usuario ${userId} se unió al canal de notificaciones`);

      // Confirmar conexión exitosa
      socket.emit('notifications_joined', {
        message: 'Conectado al canal de notificaciones',
        userId
      });

    } catch (error) {
      logger.error('Error al unirse al canal de notificaciones:', error);
      socket.emit('notification_error', { message: 'No se pudo unir al canal de notificaciones' });
    }
  }

  private handleLeaveNotifications(socket: Socket): void {
    try {
      const userId = socket.data.userId;

      // Salir de la sala de notificaciones
      socket.leave(`notifications_${userId}`);

      // Actualizar estado
      const usuario = usuariosConectados.get(userId);
      if (usuario) {
        usuario.joinedNotifications = false;
        usuario.lastActivity = new Date();
      }

      logger.info(`Usuario ${userId} salió del canal de notificaciones`);

    } catch (error) {
      logger.error('Error al salir del canal de notificaciones:', error);
    }
  }

  private async handleMarkNotificationRead(socket: Socket, notificationId: string): Promise<void> {
    try {
      const userId = socket.data.userId;

      // Marcar como leída usando el servicio
      const notificacionActualizada = await notificationsService.markAsRead(notificationId, userId);

      // Confirmar actualización al cliente
      socket.emit('notification_updated', notificacionActualizada);

      // Enviar estadísticas actualizadas
      await this.sendNotificationStats(socket, userId);

      logger.info(`Notificación marcada como leída via socket: ${notificationId} por usuario ${userId}`);

    } catch (error) {
      logger.error('Error al marcar notificación como leída via socket:', error);
      socket.emit('notification_error', {
        message: 'No se pudo marcar la notificación como leída',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  private async handleMarkAllNotificationsRead(socket: Socket): Promise<void> {
    try {
      const userId = socket.data.userId;

      // Marcar todas como leídas usando el servicio
      const resultado = await notificationsService.markAllAsRead(userId);

      // Confirmar actualización al cliente
      socket.emit('notifications_marked_read', resultado);

      // Enviar estadísticas actualizadas
      await this.sendNotificationStats(socket, userId);

      logger.info(`Todas las notificaciones marcadas como leídas via socket para usuario ${userId}`);

    } catch (error) {
      logger.error('Error al marcar todas las notificaciones como leídas via socket:', error);
      socket.emit('notification_error', {
        message: 'No se pudieron marcar todas las notificaciones como leídas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  private async handleDeleteNotification(socket: Socket, notificationId: string): Promise<void> {
    try {
      const userId = socket.data.userId;

      // Eliminar notificación usando el servicio
      await notificationsService.deleteNotification(notificationId, userId);

      // Confirmar eliminación al cliente
      socket.emit('notification_deleted', { notificationId });

      // Enviar estadísticas actualizadas
      await this.sendNotificationStats(socket, userId);

      logger.info(`Notificación eliminada via socket: ${notificationId} por usuario ${userId}`);

    } catch (error) {
      logger.error('Error al eliminar notificación via socket:', error);
      socket.emit('notification_error', {
        message: 'No se pudo eliminar la notificación',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  private async sendNotificationStats(socket: Socket, userId: string): Promise<void> {
    try {
      const stats = await notificationsService.getUserNotificationStats(userId);
      socket.emit('notification_stats_updated', stats);
    } catch (error) {
      logger.error(`Error al enviar estadísticas de notificaciones para usuario ${userId}:`, error);
    }
  }

  private handleDisconnect(socket: Socket): void {
    try {
      const userId = socket.data.userId;

      if (userId) {
        // Remover usuario conectado
        usuariosConectados.delete(userId);

        logger.info(`Usuario ${userId} desconectado de notificaciones (${socket.id})`);
      }

    } catch (error) {
      logger.error('Error en handleDisconnect de notificaciones:', error);
    }
  }

  // ==================== MÉTODOS PÚBLICOS PARA ENVIAR NOTIFICACIONES ====================

  /**
   * Enviar nueva notificación a un usuario específico
   */
  public async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    try {
      const roomName = `notifications_${userId}`;

      // Verificar si el usuario está conectado
      if (usuariosConectados.has(userId)) {
        this.notificationsNamespace.to(roomName).emit('new_notification', notification);

        // También enviar estadísticas actualizadas
        const stats = await notificationsService.getUserNotificationStats(userId);
        this.notificationsNamespace.to(roomName).emit('notification_stats_updated', stats);

        logger.info(`Notificación enviada via socket a usuario ${userId}`);
      } else {
        logger.debug(`Usuario ${userId} no está conectado a notificaciones - notificación guardada en BD`);
      }

    } catch (error) {
      logger.error(`Error al enviar notificación via socket a usuario ${userId}:`, error);
    }
  }

  /**
   * Enviar notificaciones a múltiples usuarios
   */
  public async sendNotificationToUsers(userIds: string[], notification: any): Promise<void> {
    try {
      const promises = userIds.map(userId => this.sendNotificationToUser(userId, notification));
      await Promise.all(promises);

      logger.info(`Notificación enviada via socket a ${userIds.length} usuarios`);

    } catch (error) {
      logger.error('Error al enviar notificación a múltiples usuarios:', error);
    }
  }

  /**
   * Broadcast a todos los usuarios conectados (para notificaciones del sistema)
   */
  public async broadcastSystemNotification(notification: any): Promise<void> {
    try {
      this.notificationsNamespace.emit('new_notification', notification);
      logger.info('Notificación del sistema enviada a todos los usuarios conectados');

    } catch (error) {
      logger.error('Error al enviar notificación del sistema:', error);
    }
  }

  /**
   * Notificar actualización de configuración a un usuario
   */
  public async notifySettingsUpdate(userId: string, settings: any): Promise<void> {
    try {
      const roomName = `notifications_${userId}`;
      this.notificationsNamespace.to(roomName).emit('notification_settings_updated', settings);

      logger.info(`Configuración de notificaciones actualizada via socket para usuario ${userId}`);

    } catch (error) {
      logger.error(`Error al notificar actualización de configuración a usuario ${userId}:`, error);
    }
  }

  // ==================== MÉTODOS PÚBLICOS PARA ESTADÍSTICAS ====================

  /**
   * Obtener usuarios conectados
   */
  public getConnectedUsers(): number {
    return usuariosConectados.size;
  }

  /**
   * Obtener usuarios con notificaciones activas
   */
  public getActiveNotificationUsers(): string[] {
    return Array.from(usuariosConectados.values())
      .filter(context => context.joinedNotifications)
      .map(context => context.userId);
  }

  /**
   * Verificar si un usuario está conectado
   */
  public isUserConnected(userId: string): boolean {
    return usuariosConectados.has(userId);
  }

  /**
   * Obtener información de conexión de un usuario
   */
  public getUserConnectionInfo(userId: string): NotificationSocketContext | undefined {
    return usuariosConectados.get(userId);
  }

  // ==================== INTEGRACIÓN CON SERVICIOS EXTERNOS ====================

  /**
   * Crear y enviar notificación en tiempo real
   */
  public async createAndSendNotification(data: CreateNotificationDTO): Promise<void> {
    try {
      // Crear la notificación usando el servicio
      const notification = await notificationsService.createNotification(data);

      // Enviar en tiempo real si el usuario está conectado
      await this.sendNotificationToUser(data.destinatarioId, notification);

      logger.info(`Notificación creada y enviada en tiempo real: ${notification.id}`);

    } catch (error) {
      logger.error('Error al crear y enviar notificación:', error);
      throw error;
    }
  }

  /**
   * Procesar cola de notificaciones pendientes
   */
  public async processNotificationQueue(): Promise<void> {
    try {
      // Procesar notificaciones programadas
      await notificationsService.processScheduledNotifications();

      // Limpiar notificaciones expiradas
      await notificationsService.cleanExpiredNotifications();

      logger.info('Cola de notificaciones procesada exitosamente');

    } catch (error) {
      logger.error('Error al procesar cola de notificaciones:', error);
    }
  }
}

// Función para configurar Socket.IO con notificaciones
export const setupNotificationsSocket = (io: Server): NotificationsSocketHandler => {
  return new NotificationsSocketHandler(io);
};

// Exportar instancia singleton para uso en otros módulos
let notificationsSocketInstance: NotificationsSocketHandler | null = null;

export const getNotificationsSocketInstance = (): NotificationsSocketHandler | null => {
  return notificationsSocketInstance;
};

export const setNotificationsSocketInstance = (instance: NotificationsSocketHandler): void => {
  notificationsSocketInstance = instance;
};