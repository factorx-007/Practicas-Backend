// @ts-nocheck
import { NotificationsService } from '../../../src/services/notifications.service';
import {
  Notification,
  NotificationSettings,
  NotificationTemplate
} from '../../../src/models/notifications.models';
import { prisma } from '../../../src/config/database';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  CreateNotificationDTO
} from '../../../src/types/notifications.types';

// Mocks
jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../../src/models/notifications.models', () => ({
  Notification: {
    prototype: {
      save: jest.fn(),
      marcarComoLeida: jest.fn(),
    },
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    deleteOne: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteExpired: jest.fn(),
    findPendingScheduled: jest.fn(),
    aggregate: jest.fn(),
  },
  NotificationSettings: {
    findOrCreateByUser: jest.fn(),
    prototype: {
      save: jest.fn(),
      puedeRecibir: jest.fn(),
    },
  },
  NotificationTemplate: {
    find: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  },
}));

const MockNotification = Notification as jest.MockedClass<typeof Notification>;
const MockNotificationSettings = NotificationSettings as jest.MockedClass<typeof NotificationSettings>;
const MockNotificationTemplate = NotificationTemplate as jest.MockedClass<typeof NotificationTemplate>;

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationsService = new NotificationsService();
  });

  describe('createNotification', () => {
    test('should create notification successfully', async () => {
      // Arrange
      const createData: CreateNotificationDTO = {
        titulo: 'Nueva oferta disponible',
        mensaje: 'Hay una nueva oferta que te puede interesar',
        tipo: NotificationType.NUEVA_OFERTA,
        destinatarioId: 'user-123',
        remitenteId: 'empresa-456',
        prioridad: NotificationPriority.NORMAL,
        canales: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
      };

      const mockUser = {
        id: 'user-123',
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@test.com'
      };

      const mockRemitente = {
        id: 'empresa-456',
        nombre: 'TechCorp',
        apellido: '',
        email: 'contact@techcorp.com'
      };

      const mockSettings = {
        puedeRecibir: jest.fn().mockReturnValue(true)
      };

      const mockNotification = {
        _id: 'notification-id',
        titulo: createData.titulo,
        mensaje: createData.mensaje,
        tipo: createData.tipo,
        destinatarioId: createData.destinatarioId,
        remitenteId: createData.remitenteId,
        prioridad: createData.prioridad,
        canales: createData.canales,
        estado: NotificationStatus.PENDING,
        leida: false,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        metadata: {},
        acciones: [],
        save: jest.fn().mockResolvedValue(true)
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)  // Para destinatario
        .mockResolvedValueOnce(mockRemitente);  // Para remitente

      MockNotificationSettings.findOrCreateByUser.mockResolvedValue(mockSettings);

      // Mock del constructor de Notification
      (Notification as any).mockImplementation(() => mockNotification);

      // Act
      const result = await notificationsService.createNotification(createData);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'empresa-456' }
      });
      expect(MockNotificationSettings.findOrCreateByUser).toHaveBeenCalledWith('user-123');
      expect(mockSettings.puedeRecibir).toHaveBeenCalledWith(
        NotificationType.NUEVA_OFERTA,
        NotificationChannel.IN_APP,
        expect.any(Date)
      );
      expect(mockNotification.save).toHaveBeenCalled();
      expect(result.titulo).toBe(createData.titulo);
      expect(result.destinatarioId).toBe(createData.destinatarioId);
    });

    test('should throw error when destinatario does not exist', async () => {
      // Arrange
      const createData: CreateNotificationDTO = {
        titulo: 'Test',
        mensaje: 'Test message',
        tipo: NotificationType.SISTEMA,
        destinatarioId: 'nonexistent-user'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(notificationsService.createNotification(createData))
        .rejects.toThrow('El destinatario no existe');
    });

    test('should throw error when notification is blocked by user settings', async () => {
      // Arrange
      const createData: CreateNotificationDTO = {
        titulo: 'Test',
        mensaje: 'Test message',
        tipo: NotificationType.MENSAJE,
        destinatarioId: 'user-123',
        canales: [NotificationChannel.EMAIL]
      };

      const mockUser = {
        id: 'user-123',
        nombre: 'Juan',
        apellido: 'Pérez'
      };

      const mockSettings = {
        puedeRecibir: jest.fn().mockReturnValue(false)
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      MockNotificationSettings.findOrCreateByUser.mockResolvedValue(mockSettings);

      // Act & Assert
      await expect(notificationsService.createNotification(createData))
        .rejects.toThrow('La notificación está bloqueada por la configuración del usuario');
    });
  });

  describe('getUserNotifications', () => {
    test('should get user notifications with pagination', async () => {
      // Arrange
      const userId = 'user-123';
      const params = {
        page: 1,
        limit: 10,
        tipo: NotificationType.MENSAJE,
        leida: false
      };

      const mockNotifications = [
        {
          _id: 'notif-1',
          titulo: 'Mensaje 1',
          mensaje: 'Contenido del mensaje 1',
          tipo: NotificationType.MENSAJE,
          destinatarioId: userId,
          remitenteId: 'sender-1',
          estado: NotificationStatus.SENT,
          prioridad: NotificationPriority.NORMAL,
          canales: [NotificationChannel.IN_APP],
          leida: false,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date()
        }
      ];

      const mockRemitenteData = {
        nombre: 'Ana',
        apellido: 'García',
        avatar: 'avatar.jpg'
      };

      MockNotification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockNotifications)
            })
          })
        })
      });

      MockNotification.countDocuments
        .mockResolvedValueOnce(1)  // Total
        .mockResolvedValueOnce(1); // No leídas

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRemitenteData);

      // Act
      const result = await notificationsService.getUserNotifications(userId, params);

      // Assert
      expect(MockNotification.find).toHaveBeenCalledWith({
        destinatarioId: userId,
        tipo: NotificationType.MENSAJE,
        leida: false
      });
      expect(result.notificaciones).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.noLeidas).toBe(1);
      expect(result.notificaciones[0].remitenteNombre).toBe('Ana García');
    });

    test('should handle search parameter', async () => {
      // Arrange
      const userId = 'user-123';
      const params = {
        busqueda: 'importante'
      };

      MockNotification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      MockNotification.countDocuments.mockResolvedValue(0);

      // Act
      await notificationsService.getUserNotifications(userId, params);

      // Assert
      expect(MockNotification.find).toHaveBeenCalledWith({
        destinatarioId: userId,
        $or: [
          { titulo: { $regex: 'importante', $options: 'i' } },
          { mensaje: { $regex: 'importante', $options: 'i' } }
        ]
      });
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read successfully', async () => {
      // Arrange
      const notificationId = 'notification-id';
      const userId = 'user-123';

      const mockNotification = {
        _id: notificationId,
        destinatarioId: userId,
        leida: false,
        marcarComoLeida: jest.fn().mockResolvedValue(true)
      };

      MockNotification.findOne.mockResolvedValue(mockNotification);

      // Act
      const result = await notificationsService.markAsRead(notificationId, userId);

      // Assert
      expect(MockNotification.findOne).toHaveBeenCalledWith({
        _id: notificationId,
        destinatarioId: userId
      });
      expect(mockNotification.marcarComoLeida).toHaveBeenCalled();
    });

    test('should throw error when notification not found', async () => {
      // Arrange
      const notificationId = 'nonexistent-id';
      const userId = 'user-123';

      MockNotification.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(notificationsService.markAsRead(notificationId, userId))
        .rejects.toThrow('Notificación no encontrada');
    });
  });

  describe('markAllAsRead', () => {
    test('should mark all notifications as read', async () => {
      // Arrange
      const userId = 'user-123';
      const mockResult = { modifiedCount: 5 };

      MockNotification.markAllAsRead.mockResolvedValue(mockResult);

      // Act
      const result = await notificationsService.markAllAsRead(userId);

      // Assert
      expect(MockNotification.markAllAsRead).toHaveBeenCalledWith(userId);
      expect(result.count).toBe(5);
    });
  });

  describe('deleteNotification', () => {
    test('should delete notification successfully', async () => {
      // Arrange
      const notificationId = 'notification-id';
      const userId = 'user-123';
      const mockResult = { deletedCount: 1 };

      MockNotification.deleteOne.mockResolvedValue(mockResult);

      // Act
      await notificationsService.deleteNotification(notificationId, userId);

      // Assert
      expect(MockNotification.deleteOne).toHaveBeenCalledWith({
        _id: notificationId,
        destinatarioId: userId
      });
    });

    test('should throw error when notification not found for deletion', async () => {
      // Arrange
      const notificationId = 'nonexistent-id';
      const userId = 'user-123';
      const mockResult = { deletedCount: 0 };

      MockNotification.deleteOne.mockResolvedValue(mockResult);

      // Act & Assert
      await expect(notificationsService.deleteNotification(notificationId, userId))
        .rejects.toThrow('Notificación no encontrada');
    });
  });

  describe('getUserNotificationStats', () => {
    test('should get user notification statistics', async () => {
      // Arrange
      const userId = 'user-123';

      MockNotification.countDocuments
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(3);  // noLeidas

      // Mock para getCountByField
      MockNotification.aggregate
        .mockResolvedValueOnce([  // porTipo
          { _id: NotificationType.MENSAJE, count: 5 },
          { _id: NotificationType.NUEVA_OFERTA, count: 3 }
        ])
        .mockResolvedValueOnce([  // porEstado
          { _id: NotificationStatus.SENT, count: 7 },
          { _id: NotificationStatus.READ, count: 3 }
        ])
        .mockResolvedValueOnce([  // porPrioridad
          { _id: NotificationPriority.NORMAL, count: 8 },
          { _id: NotificationPriority.HIGH, count: 2 }
        ]);

      // Mock para getCountByDateRange
      MockNotification.countDocuments
        .mockResolvedValueOnce(2)   // hoy
        .mockResolvedValueOnce(5)   // estaSemana
        .mockResolvedValueOnce(10); // esteMes

      // Act
      const result = await notificationsService.getUserNotificationStats(userId);

      // Assert
      expect(result.total).toBe(10);
      expect(result.noLeidas).toBe(3);
      expect(result.porTipo[NotificationType.MENSAJE]).toBe(5);
      expect(result.hoy).toBe(2);
      expect(result.estaSemana).toBe(5);
      expect(result.esteMes).toBe(10);
    });
  });

  describe('createBulkNotifications', () => {
    test('should create bulk notifications successfully', async () => {
      // Arrange
      const createData = {
        titulo: 'Actualización del sistema',
        mensaje: 'El sistema será actualizado esta noche',
        tipo: NotificationType.SISTEMA,
        destinatarioIds: ['user1', 'user2', 'user3'],
        prioridad: NotificationPriority.HIGH
      };

      // Mock createNotification para que sea exitoso para todos
      jest.spyOn(notificationsService, 'createNotification')
        .mockResolvedValue({
          id: 'notification-id',
          titulo: createData.titulo,
          mensaje: createData.mensaje,
          tipo: createData.tipo,
          destinatarioId: 'user1',
          estado: NotificationStatus.PENDING,
          prioridad: createData.prioridad,
          canales: [NotificationChannel.IN_APP],
          leida: false,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
          metadata: {},
          acciones: []
        });

      // Act
      const result = await notificationsService.createBulkNotifications(createData);

      // Assert
      expect(notificationsService.createNotification).toHaveBeenCalledTimes(3);
      expect(result.created).toBe(3);
      expect(result.failed).toBe(0);
    });

    test('should handle partial failures in bulk creation', async () => {
      // Arrange
      const createData = {
        titulo: 'Test bulk',
        mensaje: 'Test message',
        tipo: NotificationType.SISTEMA,
        destinatarioIds: ['user1', 'user2', 'user3']
      };

      // Mock createNotification para fallar en el segundo usuario
      jest.spyOn(notificationsService, 'createNotification')
        .mockResolvedValueOnce({
          id: 'notification-1',
          titulo: createData.titulo,
          mensaje: createData.mensaje,
          tipo: createData.tipo,
          destinatarioId: 'user1',
          estado: NotificationStatus.PENDING,
          prioridad: NotificationPriority.NORMAL,
          canales: [NotificationChannel.IN_APP],
          leida: false,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
          metadata: {},
          acciones: []
        })
        .mockRejectedValueOnce(new Error('Usuario no existe'))
        .mockResolvedValueOnce({
          id: 'notification-3',
          titulo: createData.titulo,
          mensaje: createData.mensaje,
          tipo: createData.tipo,
          destinatarioId: 'user3',
          estado: NotificationStatus.PENDING,
          prioridad: NotificationPriority.NORMAL,
          canales: [NotificationChannel.IN_APP],
          leida: false,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
          metadata: {},
          acciones: []
        });

      // Act
      const result = await notificationsService.createBulkNotifications(createData);

      // Assert
      expect(result.created).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('getUserSettings', () => {
    test('should get user notification settings', async () => {
      // Arrange
      const userId = 'user-123';
      const mockSettings = {
        userId,
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

      MockNotificationSettings.findOrCreateByUser.mockResolvedValue(mockSettings);

      // Act
      const result = await notificationsService.getUserSettings(userId);

      // Assert
      expect(MockNotificationSettings.findOrCreateByUser).toHaveBeenCalledWith(userId);
      expect(result.userId).toBe(userId);
      expect(result.configuracion[NotificationType.MENSAJE].habilitado).toBe(true);
    });
  });

  describe('updateUserSettings', () => {
    test('should update user notification settings', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        noMolestar: true,
        horarioNoMolestarDesde: '22:00',
        horarioNoMolestarHasta: '08:00'
      };

      const mockSettings = {
        userId,
        configuracion: {},
        noMolestar: false,
        save: jest.fn().mockResolvedValue(true),
        fechaActualizacion: new Date()
      };

      MockNotificationSettings.findOrCreateByUser.mockResolvedValue(mockSettings);

      // Act
      const result = await notificationsService.updateUserSettings(userId, updateData);

      // Assert
      expect(MockNotificationSettings.findOrCreateByUser).toHaveBeenCalledWith(userId);
      expect(mockSettings.noMolestar).toBe(true);
      expect(mockSettings.horarioNoMolestarDesde).toBe('22:00');
      expect(mockSettings.horarioNoMolestarHasta).toBe('08:00');
      expect(mockSettings.save).toHaveBeenCalled();
    });
  });

  describe('createTemplate', () => {
    test('should create notification template successfully', async () => {
      // Arrange
      const createData = {
        nombre: 'Template de bienvenida',
        tipo: NotificationType.SISTEMA,
        titulo: 'Bienvenido {{nombre}}',
        mensaje: 'Hola {{nombre}}, bienvenido a la plataforma',
        variables: ['nombre'],
        activo: true
      };

      const mockTemplate = {
        _id: 'template-id',
        ...createData,
        canales: [NotificationChannel.IN_APP],
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      (NotificationTemplate as any).mockImplementation(() => mockTemplate);

      // Act
      const result = await notificationsService.createTemplate(createData);

      // Assert
      expect(mockTemplate.save).toHaveBeenCalled();
      expect(result.nombre).toBe(createData.nombre);
      expect(result.variables).toEqual(['nombre']);
    });
  });

  describe('cleanExpiredNotifications', () => {
    test('should clean expired notifications', async () => {
      // Arrange
      const mockResult = { deletedCount: 5 };
      MockNotification.deleteExpired.mockResolvedValue(mockResult);

      // Act
      const result = await notificationsService.cleanExpiredNotifications();

      // Assert
      expect(MockNotification.deleteExpired).toHaveBeenCalled();
      expect(result.deleted).toBe(5);
    });
  });

  describe('processScheduledNotifications', () => {
    test('should process scheduled notifications', async () => {
      // Arrange
      const mockScheduledNotifications = [
        {
          _id: 'notif-1',
          estado: NotificationStatus.PENDING,
          save: jest.fn().mockResolvedValue(true)
        },
        {
          _id: 'notif-2',
          estado: NotificationStatus.PENDING,
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      MockNotification.findPendingScheduled.mockResolvedValue(mockScheduledNotifications);

      // Act
      const result = await notificationsService.processScheduledNotifications();

      // Assert
      expect(MockNotification.findPendingScheduled).toHaveBeenCalled();
      expect(mockScheduledNotifications[0].estado).toBe(NotificationStatus.SENT);
      expect(mockScheduledNotifications[1].estado).toBe(NotificationStatus.SENT);
      expect(result.processed).toBe(2);
    });
  });
});