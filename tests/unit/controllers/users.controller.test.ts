// @ts-nocheck
import { Request, Response } from 'express';
import usersController from '../../../src/controllers/users.controller';
import usersService from '../../../src/services/users.service';
import { UserRole } from '../../../src/types/common.types';

// Mock del servicio de usuarios
jest.mock('../../../src/services/users.service');
const mockUsersService = usersService as jest.Mocked<typeof usersService>;

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

describe('UsersController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyProfile', () => {
    test('should get student profile successfully', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const mockProfile = {
        id: 'student-id',
        usuarioId: 'test-user-id',
        carrera: 'Ingeniería de Software',
        usuario: {
          id: 'test-user-id',
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          rol: UserRole.ESTUDIANTE,
        },
      };

      mockUsersService.getStudentProfile.mockResolvedValue(mockProfile as any);

      // Act
      await usersController.getMyProfile(req, res);

      // Assert
      expect(mockUsersService.getStudentProfile).toHaveBeenCalledWith('test-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: mockProfile,
      });
    });

    test('should get company profile successfully', async () => {
      // Arrange
      const req = createMockRequest({
        user: {
          id: 'company-user-id',
          email: 'company@test.com',
          rol: UserRole.EMPRESA,
          emailVerificado: true,
          perfilCompleto: true,
        },
      }) as Request;
      const res = createMockResponse() as Response;
      const mockProfile = {
        id: 'company-id',
        usuarioId: 'company-user-id',
        nombre_empresa: 'Tech Corp',
        ruc: '12345678901',
      };

      mockUsersService.getCompanyProfile.mockResolvedValue(mockProfile as any);

      // Act
      await usersController.getMyProfile(req, res);

      // Assert
      expect(mockUsersService.getCompanyProfile).toHaveBeenCalledWith('company-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return unauthorized when user not authenticated', async () => {
      // Arrange
      const req = createMockRequest({ user: undefined }) as Request;
      const res = createMockResponse() as Response;

      // Act
      await usersController.getMyProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autenticado',
      });
    });

    test('should return not found when profile does not exist', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;

      mockUsersService.getStudentProfile.mockResolvedValue(null);

      // Act
      await usersController.getMyProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Perfil no encontrado',
      });
    });
  });

  describe('getUserProfile', () => {
    test('should get user profile by ID successfully', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'target-user-id' },
      }) as Request;
      const res = createMockResponse() as Response;
      const mockUser = {
        id: 'target-user-id',
        nombre: 'Ana',
        apellido: 'García',
        rol: UserRole.EMPRESA,
      };
      const mockCompanyProfile = {
        id: 'company-id',
        usuarioId: 'target-user-id',
        nombre_empresa: 'Innovation Co',
      };

      mockUsersService.getUserById.mockResolvedValue(mockUser as any);
      mockUsersService.getCompanyProfile.mockResolvedValue(mockCompanyProfile as any);

      // Act
      await usersController.getUserProfile(req, res);

      // Assert
      expect(mockUsersService.getUserById).toHaveBeenCalledWith('target-user-id');
      expect(mockUsersService.getCompanyProfile).toHaveBeenCalledWith('target-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return not found when user does not exist', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'non-existent-user' },
      }) as Request;
      const res = createMockResponse() as Response;

      mockUsersService.getUserById.mockResolvedValue(null);

      // Act
      await usersController.getUserProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado',
      });
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          nombre: 'Juan Carlos',
          apellido: 'Pérez García',
        },
      }) as Request;
      const res = createMockResponse() as Response;
      const mockUpdatedUser = {
        id: 'test-user-id',
        nombre: 'Juan Carlos',
        apellido: 'Pérez García',
        email: 'juan@test.com',
      };

      mockUsersService.updateUser.mockResolvedValue(mockUpdatedUser as any);

      // Act
      await usersController.updateUser(req, res);

      // Assert
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        'test-user-id',
        {
          nombre: 'Juan Carlos',
          apellido: 'Pérez García',
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: mockUpdatedUser,
      });
    });
  });

  describe('updateStudentProfile', () => {
    test('should update student profile successfully', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          carrera: 'Ingeniería Informática',
          habilidades: ['Python', 'Django'],
        },
      }) as Request;
      const res = createMockResponse() as Response;
      const mockUpdatedProfile = {
        id: 'student-id',
        carrera: 'Ingeniería Informática',
        habilidades: ['Python', 'Django'],
      };

      mockUsersService.updateStudentProfile.mockResolvedValue(mockUpdatedProfile as any);

      // Act
      await usersController.updateStudentProfile(req, res);

      // Assert
      expect(mockUsersService.updateStudentProfile).toHaveBeenCalledWith(
        'test-user-id',
        {
          carrera: 'Ingeniería Informática',
          habilidades: ['Python', 'Django'],
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return forbidden when user is not student', async () => {
      // Arrange
      const req = createMockRequest({
        user: {
          id: 'company-user-id',
          email: 'company@test.com',
          rol: UserRole.EMPRESA,
          emailVerificado: true,
          perfilCompleto: true,
        },
        body: { carrera: 'Test' },
      }) as Request;
      const res = createMockResponse() as Response;

      // Act
      await usersController.updateStudentProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Solo estudiantes pueden actualizar este perfil',
      });
    });
  });

  describe('followUser', () => {
    test('should follow user successfully', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'user-to-follow' },
      }) as Request;
      const res = createMockResponse() as Response;
      const mockFollowInfo = {
        id: 'follow-id',
        seguidorId: 'test-user-id',
        seguidoId: 'user-to-follow',
        createdAt: new Date(),
      };

      mockUsersService.followUser.mockResolvedValue(mockFollowInfo as any);

      // Act
      await usersController.followUser(req, res);

      // Assert
      expect(mockUsersService.followUser).toHaveBeenCalledWith(
        'test-user-id',
        'user-to-follow'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario seguido exitosamente',
        data: mockFollowInfo,
      });
    });

    test('should handle self-follow error', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'user-to-follow' },
      }) as Request;
      const res = createMockResponse() as Response;

      const error = new Error('CANNOT_FOLLOW_YOURSELF');
      mockUsersService.followUser.mockRejectedValue(error);

      // Act
      await usersController.followUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No puedes seguirte a ti mismo',
      });
    });

    test('should handle user not found error', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'non-existent-user' },
      }) as Request;
      const res = createMockResponse() as Response;

      const error = new Error('USER_NOT_FOUND');
      mockUsersService.followUser.mockRejectedValue(error);

      // Act
      await usersController.followUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado',
      });
    });

    test('should handle already following error', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'already-followed-user' },
      }) as Request;
      const res = createMockResponse() as Response;

      const error = new Error('ALREADY_FOLLOWING');
      mockUsersService.followUser.mockRejectedValue(error);

      // Act
      await usersController.followUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ya sigues a este usuario',
      });
    });
  });

  describe('unfollowUser', () => {
    test('should unfollow user successfully', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'user-to-unfollow' },
      }) as Request;
      const res = createMockResponse() as Response;

      mockUsersService.unfollowUser.mockResolvedValue();

      // Act
      await usersController.unfollowUser(req, res);

      // Assert
      expect(mockUsersService.unfollowUser).toHaveBeenCalledWith(
        'test-user-id',
        'user-to-unfollow'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Ya no sigues a este usuario',
        data: null,
      });
    });

    test('should handle not following error', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'user-not-followed' },
      }) as Request;
      const res = createMockResponse() as Response;

      const error = new Error('NOT_FOLLOWING');
      mockUsersService.unfollowUser.mockRejectedValue(error);

      // Act
      await usersController.unfollowUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No sigues a este usuario',
      });
    });
  });

  describe('searchUsers', () => {
    test('should search users successfully', async () => {
      // Arrange
      const req = createMockRequest({
        query: {
          search: 'Juan',
          page: '1',
          limit: '10',
          rol: 'ESTUDIANTE',
        },
      }) as Request;
      const res = createMockResponse() as Response;
      const mockSearchResult = {
        data: [
          {
            id: 'user1',
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan@test.com',
            rol: UserRole.ESTUDIANTE,
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      mockUsersService.searchUsers.mockResolvedValue(mockSearchResult as any);

      // Act
      await usersController.searchUsers(req, res);

      // Assert
      expect(mockUsersService.searchUsers).toHaveBeenCalledWith(
        { search: 'Juan', rol: 'ESTUDIANTE' },
        1,
        10
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuarios encontrados',
        data: mockSearchResult,
      });
    });
  });

  describe('deactivateUser', () => {
    test('should deactivate user successfully when admin', async () => {
      // Arrange
      const req = createMockRequest({
        user: {
          id: 'admin-user-id',
          email: 'admin@test.com',
          rol: UserRole.ADMIN,
          emailVerificado: true,
          perfilCompleto: true,
        },
        params: { userId: 'user-to-deactivate' },
      }) as Request;
      const res = createMockResponse() as Response;

      mockUsersService.deactivateUser.mockResolvedValue();

      // Act
      await usersController.deactivateUser(req, res);

      // Assert
      expect(mockUsersService.deactivateUser).toHaveBeenCalledWith('user-to-deactivate');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario desactivado exitosamente',
        data: null,
      });
    });

    test('should return forbidden when user is not admin', async () => {
      // Arrange
      const req = createMockRequest({
        params: { userId: 'user-to-deactivate' },
      }) as Request;
      const res = createMockResponse() as Response;

      // Act
      await usersController.deactivateUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Solo administradores pueden desactivar usuarios',
      });
    });
  });

  describe('activateUser', () => {
    test('should activate user successfully when admin', async () => {
      // Arrange
      const req = createMockRequest({
        user: {
          id: 'admin-user-id',
          email: 'admin@test.com',
          rol: UserRole.ADMIN,
          emailVerificado: true,
          perfilCompleto: true,
        },
        params: { userId: 'user-to-activate' },
      }) as Request;
      const res = createMockResponse() as Response;

      mockUsersService.activateUser.mockResolvedValue();

      // Act
      await usersController.activateUser(req, res);

      // Assert
      expect(mockUsersService.activateUser).toHaveBeenCalledWith('user-to-activate');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario activado exitosamente',
        data: null,
      });
    });
  });
});