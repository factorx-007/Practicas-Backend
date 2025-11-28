// @ts-nocheck
import { Request, Response } from 'express';
import socialController from '../../../src/controllers/social.controller';
import { prisma } from '../../../src/config/database';
import { ApiResponseHandler } from '../../../src/utils/responses';
import { TipoReaccion } from '../../../src/types/social.types';
import { UserRole } from '../../../src/types/common.types';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    comentario: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    reaccion: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
    },
  },
}));

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: jest.fn(() => true),
    array: jest.fn(() => []),
  })),
}));

// Mock ApiResponseHandler
jest.mock('../../../src/utils/responses', () => ({
  ApiResponseHandler: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockReq = (overrides = {}): Partial<Request> => ({
  user: {
    id: 'user-123',
    email: 'test@example.com',
    rol: UserRole.ESTUDIANTE,
    emailVerificado: true,
    perfilCompleto: true,
  },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const mockRes = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('SocialController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('debería crear un post exitosamente', async () => {
      const req = mockReq({
        body: {
          contenido: 'Mi primer post en ProTalent!',
          privado: false,
        },
      });
      const res = mockRes();

      const mockPost = {
        id: 'post-123',
        contenido: 'Mi primer post en ProTalent!',
        privado: false,
        autorId: 'user-123',
        imagenes: [],
        videos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        autor: {
          id: 'user-123',
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@example.com',
          avatar: null,
          rol: 'ESTUDIANTE',
        },
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

      await socialController.createPost(req as Request, res as Response);

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          contenido: 'Mi primer post en ProTalent!',
          privado: false,
          imagenes: [],
          videos: [],
          autorId: 'user-123',
        },
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
            },
          },
        },
      });

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockPost,
        'Post creado exitosamente'
      );
    });

    it('debería crear un post con archivos multimedia', async () => {
      const req = mockReq({
        body: {
          contenido: 'Post con imágenes!',
        },
        uploadedFiles: {
          images: [{ secure_url: 'https://example.com/image1.jpg' }],
          videos: [{ secure_url: 'https://example.com/video1.mp4' }],
        },
      });
      const res = mockRes();

      const mockPost = {
        id: 'post-123',
        contenido: 'Post con imágenes!',
        imagenes: ['https://example.com/image1.jpg'],
        videos: ['https://example.com/video1.mp4'],
        autorId: 'user-123',
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

      await socialController.createPost(req as Request, res as Response);

      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imagenes: ['https://example.com/image1.jpg'],
            videos: ['https://example.com/video1.mp4'],
          }),
        })
      );
    });
  });

  describe('getPosts', () => {
    it('debería obtener posts con paginación', async () => {
      const req = mockReq({
        query: {
          page: '1',
          limit: '10',
        },
      });
      const res = mockRes();

      const mockPosts = [
        {
          id: 'post-1',
          contenido: 'Post 1',
          autorId: 'user-1',
          autor: { id: 'user-1', nombre: 'Usuario', apellido: '1' },
        },
      ];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as jest.Mock).mockResolvedValue(1);

      await socialController.getPosts(req as Request, res as Response);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar: true,
              rol: true,
            },
          },
        },
        skip: 0,
        take: '10',
        orderBy: { createdAt: 'desc' },
      });

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          posts: mockPosts,
          pagination: expect.objectContaining({
            total: 1,
            page: '1',
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }),
        }),
        'Posts obtenidos exitosamente'
      );
    });

    it('debería filtrar posts solo de conexiones', async () => {
      const req = mockReq({
        query: {
          soloConexiones: 'true',
        },
      });
      const res = mockRes();

      const mockFollows = [
        { seguidorId: 'user-123', seguidoId: 'user-456' },
        { seguidorId: 'user-789', seguidoId: 'user-123' },
      ];

      (prisma.follow.findMany as jest.Mock).mockResolvedValue(mockFollows);
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);

      await socialController.getPosts(req as Request, res as Response);

      expect(prisma.follow.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { seguidorId: 'user-123' },
            { seguidoId: 'user-123' },
          ],
        },
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            autorId: { in: ['user-456', 'user-789', 'user-123'] },
          }),
        })
      );
    });
  });

  describe('getPostById', () => {
    it('debería obtener un post específico', async () => {
      const req = mockReq({
        params: { id: 'post-123' },
      });
      const res = mockRes();

      const mockPost = {
        id: 'post-123',
        contenido: 'Post específico',
        privado: false,
        autorId: 'user-123',
        autor: { id: 'user-123', nombre: 'Juan' },
        comentarios: [],
        reacciones: [],
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      await socialController.getPostById(req as Request, res as Response);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        include: expect.objectContaining({
          autor: expect.any(Object),
          comentarios: expect.any(Object),
          reacciones: expect.any(Object),
        }),
      });

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockPost,
        'Post obtenido exitosamente'
      );
    });

    it('debería retornar 404 si el post no existe', async () => {
      const req = mockReq({
        params: { id: 'post-inexistente' },
      });
      const res = mockRes();

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await socialController.getPostById(req as Request, res as Response);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        res,
        'Post no encontrado',
        404
      );
    });

    it('debería denegar acceso a post privado de otro usuario', async () => {
      const req = mockReq({
        params: { id: 'post-123' },
        user: { id: 'user-456' },
      });
      const res = mockRes();

      const mockPost = {
        id: 'post-123',
        privado: true,
        autorId: 'user-123',
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      await socialController.getPostById(req as Request, res as Response);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        res,
        'No tienes permisos para ver este post',
        403
      );
    });
  });

  describe('createComentario', () => {
    it('debería crear un comentario exitosamente', async () => {
      const req = mockReq({
        body: {
          contenido: 'Excelente post!',
          postId: 'post-123',
        },
      });
      const res = mockRes();

      const mockPost = {
        id: 'post-123',
        privado: false,
        autorId: 'user-456',
      };

      const mockComentario = {
        id: 'comment-123',
        contenido: 'Excelente post!',
        postId: 'post-123',
        autorId: 'user-123',
        autor: { id: 'user-123', nombre: 'Juan' },
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (prisma.comentario.create as jest.Mock).mockResolvedValue(mockComentario);

      await socialController.createComentario(req as Request, res as Response);

      expect(prisma.comentario.create).toHaveBeenCalledWith({
        data: {
          contenido: 'Excelente post!',
          postId: 'post-123',
          autorId: 'user-123',
          parentId: undefined,
        },
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar: true,
              rol: true,
            },
          },
        },
      });

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockComentario,
        'Comentario creado exitosamente'
      );
    });

    it('debería retornar error si el post no existe', async () => {
      const req = mockReq({
        body: {
          contenido: 'Comentario en post inexistente',
          postId: 'post-inexistente',
        },
      });
      const res = mockRes();

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await socialController.createComentario(req as Request, res as Response);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        res,
        'Post no encontrado',
        404
      );
    });
  });

  describe('toggleReaccion', () => {
    it('debería crear una nueva reacción', async () => {
      const req = mockReq({
        body: {
          tipo: TipoReaccion.LIKE,
          postId: 'post-123',
        },
      });
      const res = mockRes();

      const mockPost = { id: 'post-123' };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (prisma.reaccion.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.reaccion.create as jest.Mock).mockResolvedValue({});

      await socialController.toggleReaccion(req as Request, res as Response);

      expect(prisma.reaccion.create).toHaveBeenCalledWith({
        data: {
          tipo: TipoReaccion.LIKE,
          usuarioId: 'user-123',
          postId: 'post-123',
        },
      });

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        {
          accion: 'creada',
          reaccion: {}
        },
        'Reacción creada exitosamente'
      );
    });

    it('debería eliminar reacción si es del mismo tipo', async () => {
      const req = mockReq({
        body: {
          tipo: TipoReaccion.LIKE,
          postId: 'post-123',
        },
      });
      const res = mockRes();

      const mockPost = { id: 'post-123' };
      const mockReaccion = {
        id: 'reaccion-123',
        tipo: TipoReaccion.LIKE,
        usuarioId: 'user-123',
        postId: 'post-123',
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (prisma.reaccion.findFirst as jest.Mock).mockResolvedValue(mockReaccion);
      (prisma.reaccion.delete as jest.Mock).mockResolvedValue({});

      await socialController.toggleReaccion(req as Request, res as Response);

      expect(prisma.reaccion.delete).toHaveBeenCalledWith({
        where: { id: 'reaccion-123' },
      });

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        {
          accion: 'eliminada',
          reaccion: null
        },
        'Reacción eliminada exitosamente'
      );
    });

    it('debería actualizar reacción si es de diferente tipo', async () => {
      const req = mockReq({
        body: {
          tipo: TipoReaccion.LOVE,
          postId: 'post-123',
        },
      });
      const res = mockRes();

      const mockPost = { id: 'post-123' };
      const mockReaccion = {
        id: 'reaccion-123',
        tipo: TipoReaccion.LIKE,
        usuarioId: 'user-123',
        postId: 'post-123',
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (prisma.reaccion.findFirst as jest.Mock).mockResolvedValue(mockReaccion);
      (prisma.reaccion.update as jest.Mock).mockResolvedValue({});

      await socialController.toggleReaccion(req as Request, res as Response);

      expect(prisma.reaccion.update).toHaveBeenCalledWith({
        where: { id: 'reaccion-123' },
        data: { tipo: TipoReaccion.LOVE },
      });

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        {
          accion: 'actualizada',
          reaccion: {}
        },
        'Reacción actualizada exitosamente'
      );
    });
  });

  describe('getFeed', () => {
    it('debería obtener el feed personalizado del usuario', async () => {
      const req = mockReq({
        query: {
          page: '1',
          limit: '10',
        },
      });
      const res = mockRes();

      const mockFollows = [
        { seguidoId: 'user-456' },
        { seguidoId: 'user-789' },
      ];

      const mockPosts = [
        {
          id: 'post-1',
          contenido: 'Post en feed',
          autorId: 'user-456',
          autor: { id: 'user-456', nombre: 'Usuario Seguido' },
        },
      ];

      (prisma.follow.findMany as jest.Mock).mockResolvedValue(mockFollows);
      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as jest.Mock).mockResolvedValue(1);

      await socialController.getFeed(req as Request, res as Response);

      expect(prisma.follow.findMany).toHaveBeenCalledWith({
        where: { seguidorId: 'user-123' },
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: {
          autorId: { in: ['user-456', 'user-789', 'user-123'] },
          privado: false,
        },
        include: expect.objectContaining({
          autor: expect.objectContaining({
            select: expect.any(Object),
          }),
        }),
        skip: 0,
        take: '10',
        orderBy: { createdAt: 'desc' },
      });

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          posts: mockPosts,
          pagination: expect.any(Object),
        }),
        'Feed obtenido exitosamente'
      );
    });
  });
});