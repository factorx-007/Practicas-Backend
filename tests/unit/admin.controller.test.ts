import { Request, Response } from 'express';
import adminController from '../../src/controllers/admin.controller';
import adminService from '../../src/services/admin.service';
import { UserRole } from '../../src/types/common.types';

jest.mock('../../src/services/admin.service');

describe('AdminController - Gestión de Usuarios', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: {
        id: 'admin1',
        email: 'admin@test.com',
        rol: UserRole.ADMIN,
        emailVerificado: true,
        perfilCompleto: true
      }
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('debería obtener todos los usuarios exitosamente', async () => {
      const mockData = {
        data: [{ id: '1', nombre: 'Juan' }],
        pagination: { currentPage: 1, totalItems: 1 }
      };

      (adminService.getAllUsers as jest.Mock).mockResolvedValue(mockData);

      mockRequest.query = { page: '1', limit: '10' };

      await adminController.getAllUsers(mockRequest as any, mockResponse as any);

      expect(adminService.getAllUsers).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockData
        })
      );
    });

    it('debería manejar errores al obtener usuarios', async () => {
      (adminService.getAllUsers as jest.Mock).mockRejectedValue(new Error('Database error'));

      await adminController.getAllUsers(mockRequest as any, mockResponse as any);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('getUserStats', () => {
    it('debería obtener estadísticas de usuarios', async () => {
      const mockStats = {
        total: 100,
        porRol: { ESTUDIANTE: 70, EMPRESA: 20, INSTITUCION: 5, ADMIN: 5 },
        activos: 90
      };

      (adminService.getUserStats as jest.Mock).mockResolvedValue(mockStats);

      await adminController.getUserStats(mockRequest as any, mockResponse as any);

      expect(adminService.getUserStats).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats
        })
      );
    });
  });

  describe('updateUser', () => {
    it('debería actualizar un usuario exitosamente', async () => {
      const mockUser = { id: '1', nombre: 'Juan Actualizado' };
      (adminService.updateUser as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.params = { userId: '1' };
      mockRequest.body = { nombre: 'Juan Actualizado' };

      await adminController.updateUser(mockRequest as any, mockResponse as any);

      expect(adminService.updateUser).toHaveBeenCalledWith('1', { nombre: 'Juan Actualizado' });
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser
        })
      );
    });

    it('debería manejar error cuando usuario no existe', async () => {
      const error: any = new Error('Not found');
      error.code = 'P2025';
      (adminService.updateUser as jest.Mock).mockRejectedValue(error);

      mockRequest.params = { userId: '999' };

      await adminController.updateUser(mockRequest as any, mockResponse as any);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Usuario no encontrado'
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('debería eliminar un usuario exitosamente', async () => {
      (adminService.deleteUser as jest.Mock).mockResolvedValue({ success: true });

      mockRequest.params = { userId: '1' };

      await adminController.deleteUser(mockRequest as any, mockResponse as any);

      expect(adminService.deleteUser).toHaveBeenCalledWith('1');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Usuario eliminado permanentemente'
        })
      );
    });
  });

  describe('verifyUserEmail', () => {
    it('debería verificar el email de un usuario', async () => {
      const mockUser = { id: '1', emailVerificado: true };
      (adminService.verifyUserEmail as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.params = { userId: '1' };

      await adminController.verifyUserEmail(mockRequest as any, mockResponse as any);

      expect(adminService.verifyUserEmail).toHaveBeenCalledWith('1');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser
        })
      );
    });
  });

  describe('changeUserRole', () => {
    it('debería cambiar el rol de un usuario', async () => {
      const mockUser = { id: '1', rol: UserRole.ADMIN };
      (adminService.changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.params = { userId: '1' };
      mockRequest.body = { rol: UserRole.ADMIN };

      await adminController.changeUserRole(mockRequest as any, mockResponse as any);

      expect(adminService.changeUserRole).toHaveBeenCalledWith('1', UserRole.ADMIN);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('debería rechazar rol inválido', async () => {
      mockRequest.params = { userId: '1' };
      mockRequest.body = { rol: 'INVALID_ROLE' };

      await adminController.changeUserRole(mockRequest as any, mockResponse as any);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Rol inválido'
        })
      );
    });
  });
});

describe('AdminController - Gestión de Ofertas', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    const statusMock = jest.fn(() => mockResponse);
    mockRequest = { query: {}, params: {}, body: {} };
    mockResponse = { json: jsonMock, status: statusMock as any };
    jest.clearAllMocks();
  });

  describe('getAllOffers', () => {
    it('debería obtener todas las ofertas', async () => {
      const mockData = {
        data: [{ id: '1', titulo: 'Desarrollador' }],
        pagination: { currentPage: 1, totalItems: 1 }
      };

      (adminService.getAllOffers as jest.Mock).mockResolvedValue(mockData);

      await adminController.getAllOffers(mockRequest as any, mockResponse as any);

      expect(adminService.getAllOffers).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockData
        })
      );
    });
  });

  describe('getOfferStats', () => {
    it('debería obtener estadísticas de ofertas', async () => {
      const mockStats = {
        total: 50,
        verificadas: 30,
        destacadas: 10
      };

      (adminService.getOfferStats as jest.Mock).mockResolvedValue(mockStats);

      await adminController.getOfferStats(mockRequest as any, mockResponse as any);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats
        })
      );
    });
  });

  describe('approveOffer', () => {
    it('debería aprobar una oferta', async () => {
      const mockOffer = { id: '1', verificada: true };
      (adminService.approveOffer as jest.Mock).mockResolvedValue(mockOffer);

      mockRequest.params = { offerId: '1' };

      await adminController.approveOffer(mockRequest as any, mockResponse as any);

      expect(adminService.approveOffer).toHaveBeenCalledWith('1');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Oferta aprobada y activada'
        })
      );
    });
  });

  describe('rejectOffer', () => {
    it('debería rechazar una oferta', async () => {
      const mockOffer = { id: '1', verificada: false };
      (adminService.rejectOffer as jest.Mock).mockResolvedValue(mockOffer);

      mockRequest.params = { offerId: '1' };
      mockRequest.body = { razon: 'No cumple requisitos' };

      await adminController.rejectOffer(mockRequest as any, mockResponse as any);

      expect(adminService.rejectOffer).toHaveBeenCalledWith('1', 'No cumple requisitos');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Oferta rechazada'
        })
      );
    });
  });

  describe('deleteOffer', () => {
    it('debería eliminar una oferta', async () => {
      (adminService.deleteOffer as jest.Mock).mockResolvedValue({ success: true });

      mockRequest.params = { offerId: '1' };

      await adminController.deleteOffer(mockRequest as any, mockResponse as any);

      expect(adminService.deleteOffer).toHaveBeenCalledWith('1');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Oferta eliminada permanentemente'
        })
      );
    });
  });
});

describe('AdminController - Gestión de Posts', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    const statusMock = jest.fn(() => mockResponse);
    mockRequest = { query: {}, params: {}, body: {} };
    mockResponse = { json: jsonMock, status: statusMock as any };
    jest.clearAllMocks();
  });

  describe('getAllPosts', () => {
    it('debería obtener todos los posts', async () => {
      const mockData = {
        data: [{ id: '1', contenido: 'Post de prueba' }],
        pagination: { currentPage: 1, totalItems: 1 }
      };

      (adminService.getAllPosts as jest.Mock).mockResolvedValue(mockData);

      await adminController.getAllPosts(mockRequest as any, mockResponse as any);

      expect(adminService.getAllPosts).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockData
        })
      );
    });
  });

  describe('getPostStats', () => {
    it('debería obtener estadísticas de posts', async () => {
      const mockStats = {
        total: 100,
        ocultos: 5,
        reportados: 3
      };

      (adminService.getPostStats as jest.Mock).mockResolvedValue(mockStats);

      await adminController.getPostStats(mockRequest as any, mockResponse as any);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats
        })
      );
    });
  });

  describe('hidePost', () => {
    it('debería ocultar un post', async () => {
      const mockPost = { id: '1', oculto: true };
      (adminService.hidePost as jest.Mock).mockResolvedValue(mockPost);

      mockRequest.params = { postId: '1' };
      mockRequest.body = { razon: 'Contenido inapropiado' };

      await adminController.hidePost(mockRequest as any, mockResponse as any);

      expect(adminService.hidePost).toHaveBeenCalledWith('1', 'Contenido inapropiado');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Post ocultado exitosamente'
        })
      );
    });
  });

  describe('unhidePost', () => {
    it('debería mostrar un post oculto', async () => {
      const mockPost = { id: '1', oculto: false };
      (adminService.unhidePost as jest.Mock).mockResolvedValue(mockPost);

      mockRequest.params = { postId: '1' };

      await adminController.unhidePost(mockRequest as any, mockResponse as any);

      expect(adminService.unhidePost).toHaveBeenCalledWith('1');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Post visible nuevamente'
        })
      );
    });
  });

  describe('deletePost', () => {
    it('debería eliminar un post', async () => {
      (adminService.deletePost as jest.Mock).mockResolvedValue({ success: true });

      mockRequest.params = { postId: '1' };

      await adminController.deletePost(mockRequest as any, mockResponse as any);

      expect(adminService.deletePost).toHaveBeenCalledWith('1');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Post eliminado permanentemente'
        })
      );
    });
  });

  describe('deleteComment', () => {
    it('debería eliminar un comentario', async () => {
      (adminService.deleteComment as jest.Mock).mockResolvedValue({ success: true });

      mockRequest.params = { commentId: '1' };

      await adminController.deleteComment(mockRequest as any, mockResponse as any);

      expect(adminService.deleteComment).toHaveBeenCalledWith('1');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Comentario eliminado exitosamente'
        })
      );
    });
  });
});

describe('AdminController - Dashboard', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    const statusMock = jest.fn(() => mockResponse);
    mockRequest = {};
    mockResponse = { json: jsonMock, status: statusMock as any };
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('debería obtener estadísticas del dashboard', async () => {
      const mockStats = {
        usuarios: { total: 100, nuevosHoy: 5 },
        ofertas: { total: 50, activas: 30 },
        contenido: { totalPosts: 200 }
      };

      (adminService.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      await adminController.getDashboard(mockRequest as any, mockResponse as any);

      expect(adminService.getDashboardStats).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats
        })
      );
    });
  });
});