// @ts-nocheck
import { Request, Response } from 'express';
import notificationsController from '../../../src/controllers/notifications.controller';
import { NotificationsService } from '../../../src/services/notifications.service';
import { UserRole } from '../../../src/types/common.types';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel
} from '../../../src/types/notifications.types';

// Mock del servicio de notificaciones
jest.mock('../../../src/services/notifications.service');
const MockNotificationsService = NotificationsService as jest.MockedClass<typeof NotificationsService>;

// Helper para crear request mock
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    rol: UserRole.ESTUDIANTE,
    emailVerificado: true,
    perfilCompleto: true,
  },
  params: {},
  query: {},
  body: {},
  ...overrides,
});

// Helper para crear response mock
const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('NotificationsController', () => {
  let mockNotificationsService: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationsService = new MockNotificationsService() as jest.Mocked<NotificationsService>;
    // Reemplazar la instancia en el controlador
    (notificationsController as any).notificationsService = mockNotificationsService;
  });

  describe('createNotification', () => {
    test('should create notification successfully', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          titulo: 'Nueva oferta disponible',
          mensaje: 'Hay una nueva oferta de trabajo que te puede interesar',
          tipo: NotificationType.NUEVA_OFERTA,
          destinatarioId: 'destinatario-id',
          prioridad: NotificationPriority.NORMAL
        }
      }) as Request;
      const res = createMockResponse() as Response;

      const mockNotification = {
        id: 'notification-id',
        titulo: 'Nueva oferta disponible',
        mensaje: 'Hay una nueva oferta de trabajo que te puede interesar',
        tipo: NotificationType.NUEVA_OFERTA,
        destinatarioId: 'destinatario-id',
        remitenteId: 'test-user-id',
        estado: NotificationStatus.PENDING,
        prioridad: NotificationPriority.NORMAL,
        canales: [NotificationChannel.IN_APP],
        leida: false,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        metadata: {},
        acciones: []
      };

      mockNotificationsService.createNotification.mockResolvedValue(mockNotification);

      // Act
      await notificationsController.createNotification(req, res);

      // Assert
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith({
        titulo: 'Nueva oferta disponible',
        mensaje: 'Hay una nueva oferta de trabajo que te puede interesar',
        tipo: NotificationType.NUEVA_OFERTA,
        destinatarioId: 'destinatario-id',
        remitenteId: 'test-user-id',
        prioridad: NotificationPriority.NORMAL
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notificación creada exitosamente',
        data: mockNotification
      });
    });

    test('should handle service errors', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          titulo: 'Test',
          mensaje: 'Test message',
          tipo: NotificationType.SISTEMA,
          destinatarioId: 'invalid-id'
        }
      }) as Request;
      const res = createMockResponse() as Response;

      mockNotificationsService.createNotification.mockRejectedValue(new Error('Usuario no encontrado'));

      // Act
      await notificationsController.createNotification(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado'
      });
    });
  });

  describe('createBulkNotifications', () => {
    test('should create bulk notifications successfully', async () => {
      // Arrange
      const req = createMockRequest({
        user: { id: 'admin-id', rol: UserRole.ADMIN },
        body: {
          titulo: 'Actualización del sistema',
          mensaje: 'El sistema será actualizado esta noche',
          tipo: NotificationType.SISTEMA,
          destinatarioIds: ['user1', 'user2', 'user3']
        }
      }) as Request;
      const res = createMockResponse() as Response;

      const mockResult = { created: 3, failed: 0 };
      mockNotificationsService.createBulkNotifications.mockResolvedValue(mockResult);

      // Act
      await notificationsController.createBulkNotifications(req, res);

      // Assert
      expect(mockNotificationsService.createBulkNotifications).toHaveBeenCalledWith({
        titulo: 'Actualización del sistema',
        mensaje: 'El sistema será actualizado esta noche',
        tipo: NotificationType.SISTEMA,
        destinatarioIds: ['user1', 'user2', 'user3'],
        remitenteId: 'admin-id'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notificaciones masivas creadas',
        data: mockResult
      });
    });
  });

  describe('getMyNotifications', () => {
    test('should get user notifications with pagination', async () => {
      // Arrange
      const req = createMockRequest({
        query: {
          page: '1',
          limit: '10',
          tipo: NotificationType.MENSAJE,
          leida: 'false'
        }
      }) as Request;
      const res = createMockResponse() as Response;

      const mockResponse = {
        notificaciones: [
          {
            id: 'notif-1',
            titulo: 'Nuevo mensaje',
            mensaje: 'Tienes un nuevo mensaje',
            tipo: NotificationType.MENSAJE,
            destinatarioId: 'test-user-id',
            estado: NotificationStatus.SENT,
            prioridad: NotificationPriority.NORMAL,
            canales: [NotificationChannel.IN_APP],
            leida: false,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        noLeidas: 1
      };

      mockNotificationsService.getUserNotifications.mockResolvedValue(mockResponse);

      // Act
      await notificationsController.getMyNotifications(req, res);

      // Assert
      expect(mockNotificationsService.getUserNotifications).toHaveBeenCalledWith('test-user-id', {
        page: 1,
        limit: 10,
        tipo: NotificationType.MENSAJE,
        leida: false,
        fechaDesde: undefined,
        fechaHasta: undefined,
        remitenteId: undefined,
        busqueda: undefined,
        orderBy: undefined,
        order: undefined,
        estado: undefined,
        prioridad: undefined
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notificaciones obtenidas exitosamente',
        data: mockResponse
      });
    });
  });

  describe('getNotificationById', () => {
    test('should get notification by id successfully', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: 'notification-id' }
      }) as Request;
      const res = createMockResponse() as Response;

      const mockNotification = {
        id: 'notification-id',
        titulo: 'Test notification',
        mensaje: 'Test message',
        tipo: NotificationType.SISTEMA,
        destinatarioId: 'test-user-id',
        estado: NotificationStatus.SENT,
        prioridad: NotificationPriority.NORMAL,
        canales: [NotificationChannel.IN_APP],
        leida: false,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };

      mockNotificationsService.getNotificationById.mockResolvedValue(mockNotification);

      // Act
      await notificationsController.getNotificationById(req, res);

      // Assert
      expect(mockNotificationsService.getNotificationById).toHaveBeenCalledWith('notification-id', 'test-user-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notificación obtenida exitosamente',
        data: mockNotification
      });
    });

    test('should handle notification not found', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: 'nonexistent-id' }
      }) as Request;
      const res = createMockResponse() as Response;

      mockNotificationsService.getNotificationById.mockRejectedValue(new Error('Notificación no encontrada'));

      // Act
      await notificationsController.getNotificationById(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Notificación no encontrada'
      });
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read successfully', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: 'notification-id' }
      }) as Request;
      const res = createMockResponse() as Response;

      const mockUpdatedNotification = {
        id: 'notification-id',
        titulo: 'Test notification',
        mensaje: 'Test message',
        tipo: NotificationType.SISTEMA,
        destinatarioId: 'test-user-id',
        estado: NotificationStatus.READ,
        prioridad: NotificationPriority.NORMAL,
        canales: [NotificationChannel.IN_APP],
        leida: true,
        fechaLectura: new Date(),
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };

      mockNotificationsService.markAsRead.mockResolvedValue(mockUpdatedNotification);

      // Act
      await notificationsController.markAsRead(req, res);

      // Assert
      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith('notification-id', 'test-user-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notificación marcada como leída',
        data: mockUpdatedNotification
      });
    });
  });

  describe('markAllAsRead', () => {
    test('should mark all notifications as read successfully', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;

      const mockResult = { count: 5 };
      mockNotificationsService.markAllAsRead.mockResolvedValue(mockResult);

      // Act
      await notificationsController.markAllAsRead(req, res);

      // Assert
      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith('test-user-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas',
        data: mockResult
      });
    });
  });

  describe('deleteNotification', () => {
    test('should delete notification successfully', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: 'notification-id' }
      }) as Request;
      const res = createMockResponse() as Response;

      mockNotificationsService.deleteNotification.mockResolvedValue(undefined);

      // Act
      await notificationsController.deleteNotification(req, res);

      // Assert
      expect(mockNotificationsService.deleteNotification).toHaveBeenCalledWith('notification-id', 'test-user-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notificación eliminada exitosamente',
        data: null
      });
    });
  });

  describe('getNotificationStats', () => {
    test('should get notification stats successfully', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;

      const mockStats = {
        total: 10,
        noLeidas: 3,
        porTipo: {
          [NotificationType.MENSAJE]: 5,
          [NotificationType.NUEVA_OFERTA]: 3,
          [NotificationType.SISTEMA]: 2
        },
        porEstado: {
          [NotificationStatus.SENT]: 7,
          [NotificationStatus.READ]: 3
        },
        porPrioridad: {
          [NotificationPriority.NORMAL]: 8,
          [NotificationPriority.HIGH]: 2
        },
        hoy: 2,
        estaSemana: 5,
        esteMes: 10
      };

      mockNotificationsService.getUserNotificationStats.mockResolvedValue(mockStats);

      // Act
      await notificationsController.getNotificationStats(req, res);

      // Assert
      expect(mockNotificationsService.getUserNotificationStats).toHaveBeenCalledWith('test-user-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: mockStats
      });
    });
  });

  describe('getNotificationSettings', () => {
    test('should get notification settings successfully', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;

      const mockSettings = {
        userId: 'test-user-id',
        configuracion: {
          [NotificationType.MENSAJE]: {
            habilitado: true,
            canales: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            sonido: true,
            vibration: true,
            horarioDesde: '08:00',
            horarioHasta: '22:00'
          }
        },
        noMolestar: false,
        fechaActualizacion: new Date()
      };

      mockNotificationsService.getUserSettings.mockResolvedValue(mockSettings);

      // Act
      await notificationsController.getNotificationSettings(req, res);

      // Assert
      expect(mockNotificationsService.getUserSettings).toHaveBeenCalledWith('test-user-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Configuración obtenida exitosamente',
        data: mockSettings
      });
    });
  });

  describe('updateNotificationSettings', () => {
    test('should update notification settings successfully', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          noMolestar: true,
          horarioNoMolestarDesde: '22:00',
          horarioNoMolestarHasta: '08:00'
        }
      }) as Request;
      const res = createMockResponse() as Response;

      const mockUpdatedSettings = {
        userId: 'test-user-id',
        configuracion: {
          [NotificationType.MENSAJE]: {
            habilitado: true,
            canales: [NotificationChannel.IN_APP],
            sonido: true,
            vibration: true
          }
        },
        noMolestar: true,
        horarioNoMolestarDesde: '22:00',
        horarioNoMolestarHasta: '08:00',
        fechaActualizacion: new Date()
      };

      mockNotificationsService.updateUserSettings.mockResolvedValue(mockUpdatedSettings);

      // Act
      await notificationsController.updateNotificationSettings(req, res);

      // Assert
      expect(mockNotificationsService.updateUserSettings).toHaveBeenCalledWith('test-user-id', {
        noMolestar: true,
        horarioNoMolestarDesde: '22:00',
        horarioNoMolestarHasta: '08:00'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: mockUpdatedSettings
      });
    });
  });

  describe('createTemplate', () => {
    test('should create template successfully for admin', async () => {
      // Arrange
      const req = createMockRequest({
        user: { id: 'admin-id', rol: UserRole.ADMIN },
        body: {
          nombre: 'Template de bienvenida',
          tipo: NotificationType.SISTEMA,
          titulo: 'Bienvenido a {{nombre_plataforma}}',
          mensaje: 'Hola {{nombre_usuario}}, bienvenido a nuestra plataforma',
          variables: ['nombre_plataforma', 'nombre_usuario'],
          activo: true
        }
      }) as Request;
      const res = createMockResponse() as Response;

      const mockTemplate = {
        id: 'template-id',
        nombre: 'Template de bienvenida',
        tipo: NotificationType.SISTEMA,
        titulo: 'Bienvenido a {{nombre_plataforma}}',
        mensaje: 'Hola {{nombre_usuario}}, bienvenido a nuestra plataforma',
        variables: ['nombre_plataforma', 'nombre_usuario'],
        canales: [NotificationChannel.IN_APP],
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };

      mockNotificationsService.createTemplate.mockResolvedValue(mockTemplate);

      // Act
      await notificationsController.createTemplate(req, res);

      // Assert
      expect(mockNotificationsService.createTemplate).toHaveBeenCalledWith({
        nombre: 'Template de bienvenida',
        tipo: NotificationType.SISTEMA,
        titulo: 'Bienvenido a {{nombre_plataforma}}',
        mensaje: 'Hola {{nombre_usuario}}, bienvenido a nuestra plataforma',
        variables: ['nombre_plataforma', 'nombre_usuario'],
        activo: true
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Template creado exitosamente',
        data: mockTemplate
      });
    });

    test('should reject template creation for non-admin', async () => {
      // Arrange
      const req = createMockRequest({
        user: { id: 'user-id', rol: UserRole.ESTUDIANTE },
        body: {
          nombre: 'Template test',
          tipo: NotificationType.SISTEMA,
          titulo: 'Test',
          mensaje: 'Test message'
        }
      }) as Request;
      const res = createMockResponse() as Response;

      // Act
      await notificationsController.createTemplate(req, res);

      // Assert
      expect(mockNotificationsService.createTemplate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    });
  });

  describe('getUnreadCount', () => {
    test('should get unread count successfully', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;

      const mockStats = {
        total: 10,
        noLeidas: 3,
        porTipo: {},
        porEstado: {},
        porPrioridad: {},
        hoy: 1,
        estaSemana: 2,
        esteMes: 3
      };

      mockNotificationsService.getUserNotificationStats.mockResolvedValue(mockStats);

      // Act
      await notificationsController.getUnreadCount(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conteo obtenido exitosamente',
        data: { count: 3 }
      });
    });
  });
});