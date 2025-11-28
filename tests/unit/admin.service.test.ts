import adminService from '../../src/services/admin.service';
import prisma from '../../src/config/database';
import { UserRole } from '../../src/types/common.types';

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    usuario: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    oferta: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    comentario: {
      count: jest.fn(),
      delete: jest.fn()
    },
    reaccion: {
      count: jest.fn()
    },
    postulacion: {
      count: jest.fn()
    }
  }
}));

describe('AdminService - Gestión de Usuarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('debería obtener todos los usuarios con paginación', async () => {
      const mockUsers = [
        {
          id: '1',
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          rol: UserRole.ESTUDIANTE,
          activo: true,
          emailVerificado: false,
          perfilCompleto: true,
          _count: { seguidores: 5, posts: 10 }
        }
      ];

      (prisma.usuario.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.usuario.count as jest.Mock).mockResolvedValue(1);

      const result = await adminService.getAllUsers({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockUsers);
      expect(result.pagination.totalItems).toBe(1);
      expect(prisma.usuario.findMany).toHaveBeenCalled();
    });

    it('debería filtrar usuarios por rol', async () => {
      (prisma.usuario.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.usuario.count as jest.Mock).mockResolvedValue(0);

      await adminService.getAllUsers({ rol: UserRole.ADMIN });

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rol: UserRole.ADMIN })
        })
      );
    });

    it('debería buscar usuarios por texto', async () => {
      (prisma.usuario.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.usuario.count as jest.Mock).mockResolvedValue(0);

      await adminService.getAllUsers({ search: 'Juan' });

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array)
          })
        })
      );
    });
  });

  describe('getUserStats', () => {
    it('debería obtener estadísticas de usuarios', async () => {
      (prisma.usuario.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(60)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(100);

      (prisma.usuario.groupBy as jest.Mock).mockResolvedValue([
        { rol: 'ESTUDIANTE', _count: 70 },
        { rol: 'EMPRESA', _count: 20 },
        { rol: 'ADMIN', _count: 10 }
      ]);

      const stats = await adminService.getUserStats();

      expect(stats.total).toBe(100);
      expect(stats.porRol.ESTUDIANTE).toBe(70);
      expect(stats.activos).toBe(80);
      expect(stats.verificados).toBe(60);
    });
  });

  describe('updateUser', () => {
    it('debería actualizar un usuario', async () => {
      const mockUser = {
        id: '1',
        nombre: 'Juan Actualizado',
        email: 'juan@test.com',
        rol: UserRole.ESTUDIANTE
      };

      (prisma.usuario.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await adminService.updateUser('1', { nombre: 'Juan Actualizado' });

      expect(result.nombre).toBe('Juan Actualizado');
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' }
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('debería eliminar un usuario permanentemente', async () => {
      (prisma.usuario.delete as jest.Mock).mockResolvedValue({});

      const result = await adminService.deleteUser('1');

      expect(result.success).toBe(true);
      expect(prisma.usuario.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('verifyUserEmail', () => {
    it('debería verificar el email de un usuario', async () => {
      const mockUser = { id: '1', emailVerificado: true };
      (prisma.usuario.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await adminService.verifyUserEmail('1');

      expect(result.emailVerificado).toBe(true);
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { emailVerificado: true }
        })
      );
    });
  });

  describe('changeUserRole', () => {
    it('debería cambiar el rol de un usuario', async () => {
      const mockUser = { id: '1', rol: UserRole.ADMIN };
      (prisma.usuario.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await adminService.changeUserRole('1', UserRole.ADMIN);

      expect(result.rol).toBe(UserRole.ADMIN);
    });
  });
});

describe('AdminService - Gestión de Ofertas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllOffers', () => {
    it('debería obtener todas las ofertas con paginación', async () => {
      const mockOffers = [
        {
          id: '1',
          titulo: 'Desarrollador Frontend',
          verificada: false,
          destacada: false,
          _count: { postulaciones: 5 }
        }
      ];

      (prisma.oferta.findMany as jest.Mock).mockResolvedValue(mockOffers);
      (prisma.oferta.count as jest.Mock).mockResolvedValue(1);

      const result = await adminService.getAllOffers({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockOffers);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('debería filtrar ofertas verificadas', async () => {
      (prisma.oferta.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.oferta.count as jest.Mock).mockResolvedValue(0);

      await adminService.getAllOffers({ verificada: true });

      expect(prisma.oferta.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ verificada: true })
        })
      );
    });
  });

  describe('getOfferStats', () => {
    it('debería obtener estadísticas de ofertas', async () => {
      (prisma.oferta.count as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(50);

      (prisma.oferta.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { estado: 'PUBLICADA', _count: 30 },
          { estado: 'CERRADA', _count: 20 }
        ])
        .mockResolvedValueOnce([
          { modalidad: 'REMOTO', _count: 25 },
          { modalidad: 'PRESENCIAL', _count: 25 }
        ]);

      (prisma.postulacion.count as jest.Mock).mockResolvedValue(100);

      const stats = await adminService.getOfferStats();

      expect(stats.total).toBe(50);
      expect(stats.verificadas).toBe(30);
      expect(stats.totalPostulaciones).toBe(100);
    });
  });

  describe('approveOffer', () => {
    it('debería aprobar una oferta', async () => {
      const mockOffer = { id: '1', verificada: true, estado: 'PUBLICADA' };
      (prisma.oferta.update as jest.Mock).mockResolvedValue(mockOffer);

      const result = await adminService.approveOffer('1');

      expect(result.verificada).toBe(true);
      expect(prisma.oferta.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ verificada: true })
        })
      );
    });
  });

  describe('rejectOffer', () => {
    it('debería rechazar una oferta', async () => {
      const mockOffer = { id: '1', verificada: false, estado: 'CERRADA' };
      (prisma.oferta.update as jest.Mock).mockResolvedValue(mockOffer);

      const result = await adminService.rejectOffer('1', 'No cumple requisitos');

      expect(result.verificada).toBe(false);
    });
  });

  describe('deleteOffer', () => {
    it('debería eliminar una oferta', async () => {
      (prisma.oferta.delete as jest.Mock).mockResolvedValue({});

      const result = await adminService.deleteOffer('1');

      expect(result.success).toBe(true);
    });
  });
});

describe('AdminService - Gestión de Posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPosts', () => {
    it('debería obtener todos los posts', async () => {
      const mockPosts = [
        {
          id: '1',
          contenido: 'Post de prueba',
          oculto: false,
          reportado: false,
          _count: { reacciones: 5, comentarios: 3 }
        }
      ];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as jest.Mock).mockResolvedValue(1);

      const result = await adminService.getAllPosts({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockPosts);
    });

    it('debería filtrar posts reportados', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);

      await adminService.getAllPosts({ reportado: true });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reportado: true })
        })
      );
    });
  });

  describe('getPostStats', () => {
    it('debería obtener estadísticas de posts', async () => {
      (prisma.post.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(100);

      (prisma.reaccion.count as jest.Mock).mockResolvedValue(500);
      (prisma.comentario.count as jest.Mock).mockResolvedValue(200);

      const stats = await adminService.getPostStats();

      expect(stats.total).toBe(100);
      expect(stats.ocultos).toBe(5);
      expect(stats.reportados).toBe(3);
      expect(stats.totalReacciones).toBe(500);
      expect(stats.totalComentarios).toBe(200);
    });
  });

  describe('hidePost', () => {
    it('debería ocultar un post', async () => {
      const mockPost = { id: '1', oculto: true };
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      const result = await adminService.hidePost('1', 'Contenido inapropiado');

      expect(result.oculto).toBe(true);
    });
  });

  describe('unhidePost', () => {
    it('debería mostrar un post oculto', async () => {
      const mockPost = { id: '1', oculto: false };
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      const result = await adminService.unhidePost('1');

      expect(result.oculto).toBe(false);
    });
  });

  describe('deletePost', () => {
    it('debería eliminar un post', async () => {
      (prisma.post.delete as jest.Mock).mockResolvedValue({});

      const result = await adminService.deletePost('1');

      expect(result.success).toBe(true);
    });
  });

  describe('deleteComment', () => {
    it('debería eliminar un comentario', async () => {
      (prisma.comentario.delete as jest.Mock).mockResolvedValue({});

      const result = await adminService.deleteComment('1');

      expect(result.success).toBe(true);
    });
  });
});

describe('AdminService - Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('debería obtener estadísticas del dashboard', async () => {
      (prisma.usuario.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(80);

      (prisma.oferta.count as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(5);

      (prisma.postulacion.count as jest.Mock).mockResolvedValue(200);
      (prisma.post.count as jest.Mock)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(10);

      (prisma.reaccion.count as jest.Mock).mockResolvedValue(500);
      (prisma.comentario.count as jest.Mock).mockResolvedValue(300);

      const stats = await adminService.getDashboardStats();

      expect(stats.usuarios.total).toBe(100);
      expect(stats.usuarios.nuevosHoy).toBe(5);
      expect(stats.ofertas.total).toBe(50);
      expect(stats.contenido.totalPosts).toBe(150);
    });
  });
});