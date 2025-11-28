// @ts-nocheck
import { Request, Response } from 'express';
import chatController from '../../../src/controllers/chat.controller';
import chatService from '../../../src/services/chat.service';
import { ApiResponseHandler } from '../../../src/utils/responses';
import { TipoConversacion, TipoMensaje } from '../../../src/models/chat.models';
import { UserRole } from '../../../src/types/common.types';

// Mock del servicio de chat
jest.mock('../../../src/services/chat.service');
const mockChatService = chatService as jest.Mocked<typeof chatService>;

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
    created: jest.fn(),
    error: jest.fn(),
    notFound: jest.fn(),
    forbidden: jest.fn(),
    validationError: jest.fn(),
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

describe('ChatController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversacion', () => {
    it('debería crear una conversación exitosamente', async () => {
      const req = mockReq({
        body: {
          tipo: TipoConversacion.GRUPO,
          nombre: 'Equipo de Desarrollo',
          participantes: ['user-123', 'user-456', 'user-789'],
        },
      });
      const res = mockRes();

      const mockConversacion = {
        _id: 'conv-123',
        tipo: TipoConversacion.GRUPO,
        nombre: 'Equipo de Desarrollo',
        participantes: [],
        creadorId: 'user-123',
        fechaCreacion: new Date(),
      };

      mockChatService.createConversacion.mockResolvedValue(mockConversacion);

      await chatController.createConversacion(req as Request, res as Response);

      expect(mockChatService.createConversacion).toHaveBeenCalledWith(
        req.body,
        'user-123'
      );
      expect(ApiResponseHandler.created).toHaveBeenCalledWith(
        res,
        mockConversacion,
        'Conversación creada exitosamente'
      );
    });

    it('debería manejar errores al crear conversación', async () => {
      const req = mockReq({
        body: {
          tipo: TipoConversacion.PRIVADA,
          participantes: ['user-123'],
        },
      });
      const res = mockRes();

      mockChatService.createConversacion.mockRejectedValue(
        new Error('Error al crear conversación')
      );

      await chatController.createConversacion(req as Request, res as Response);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        res,
        'Error al crear conversación',
        500
      );
    });
  });

  describe('getConversaciones', () => {
    it('debería obtener conversaciones del usuario', async () => {
      const req = mockReq({
        query: {
          page: '1',
          limit: '20',
        },
      });
      const res = mockRes();

      const mockResponse = {
        conversaciones: [
          {
            _id: 'conv-1',
            tipo: TipoConversacion.PRIVADA,
            participantes: [],
            fechaCreacion: new Date(),
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockChatService.getConversacionesUsuario.mockResolvedValue(mockResponse);

      await chatController.getConversaciones(req as Request, res as Response);

      expect(mockChatService.getConversacionesUsuario).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          page: '1',
          limit: '20',
        })
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockResponse,
        'Conversaciones obtenidas exitosamente'
      );
    });
  });

  describe('getConversacionById', () => {
    it('debería obtener una conversación específica', async () => {
      const req = mockReq({
        params: { id: 'conv-123' },
      });
      const res = mockRes();

      const mockConversacion = {
        _id: 'conv-123',
        tipo: TipoConversacion.GRUPO,
        nombre: 'Equipo',
        participantes: [],
        fechaCreacion: new Date(),
      };

      mockChatService.getConversacionById.mockResolvedValue(mockConversacion);

      await chatController.getConversacionById(req as Request, res as Response);

      expect(mockChatService.getConversacionById).toHaveBeenCalledWith(
        'conv-123',
        'user-123'
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockConversacion,
        'Conversación obtenida exitosamente'
      );
    });

    it('debería retornar 404 si la conversación no existe', async () => {
      const req = mockReq({
        params: { id: 'conv-inexistente' },
      });
      const res = mockRes();

      mockChatService.getConversacionById.mockRejectedValue(
        new Error('Conversación no encontrada')
      );

      await chatController.getConversacionById(req as Request, res as Response);

      expect(ApiResponseHandler.notFound).toHaveBeenCalledWith(
        res,
        'Conversación no encontrada'
      );
    });
  });

  describe('enviarMensaje', () => {
    it('debería enviar un mensaje exitosamente', async () => {
      const req = mockReq({
        body: {
          conversacionId: 'conv-123',
          contenido: 'Hola equipo!',
          tipo: TipoMensaje.TEXTO,
        },
      });
      const res = mockRes();

      const mockMensaje = {
        _id: 'msg-123',
        conversacionId: 'conv-123',
        autorId: 'user-123',
        contenido: 'Hola equipo!',
        tipo: TipoMensaje.TEXTO,
        fechaCreacion: new Date(),
      };

      mockChatService.enviarMensaje.mockResolvedValue(mockMensaje);

      await chatController.enviarMensaje(req as Request, res as Response);

      expect(mockChatService.enviarMensaje).toHaveBeenCalledWith(
        req.body,
        'user-123'
      );
      expect(ApiResponseHandler.created).toHaveBeenCalledWith(
        res,
        mockMensaje,
        'Mensaje enviado exitosamente'
      );
    });

    it('debería enviar mensaje con archivos adjuntos', async () => {
      const req = mockReq({
        body: {
          conversacionId: 'conv-123',
          contenido: 'Aquí está el documento',
        },
        uploadedFiles: {
          images: [{ secure_url: 'https://example.com/image.jpg' }],
          files: [{ secure_url: 'https://example.com/document.pdf' }],
        },
      });
      const res = mockRes();

      const mockMensaje = {
        _id: 'msg-123',
        conversacionId: 'conv-123',
        autorId: 'user-123',
        contenido: 'Aquí está el documento',
        archivosAdjuntos: [
          { url: 'https://example.com/image.jpg' },
          { url: 'https://example.com/document.pdf' },
        ],
        fechaCreacion: new Date(),
      };

      mockChatService.enviarMensaje.mockResolvedValue(mockMensaje);

      await chatController.enviarMensaje(req as Request, res as Response);

      expect(mockChatService.enviarMensaje).toHaveBeenCalledWith(
        expect.objectContaining({
          conversacionId: 'conv-123',
          contenido: 'Aquí está el documento',
          archivosAdjuntos: expect.any(Array),
        }),
        'user-123'
      );
    });

    it('debería manejar error de permisos', async () => {
      const req = mockReq({
        body: {
          conversacionId: 'conv-123',
          contenido: 'Mensaje no autorizado',
        },
      });
      const res = mockRes();

      mockChatService.enviarMensaje.mockRejectedValue(
        new Error('Solo los administradores pueden enviar mensajes')
      );

      await chatController.enviarMensaje(req as Request, res as Response);

      expect(ApiResponseHandler.forbidden).toHaveBeenCalledWith(
        res,
        'Solo los administradores pueden enviar mensajes'
      );
    });
  });

  describe('getMensajes', () => {
    it('debería obtener mensajes de una conversación', async () => {
      const req = mockReq({
        params: { conversacionId: 'conv-123' },
        query: {
          page: '1',
          limit: '50',
        },
      });
      const res = mockRes();

      const mockResponse = {
        mensajes: [
          {
            _id: 'msg-1',
            conversacionId: 'conv-123',
            autorId: 'user-123',
            contenido: 'Hola',
            fechaCreacion: new Date(),
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockChatService.getMensajes.mockResolvedValue(mockResponse);

      await chatController.getMensajes(req as Request, res as Response);

      expect(mockChatService.getMensajes).toHaveBeenCalledWith(
        'conv-123',
        'user-123',
        expect.objectContaining({
          conversacionId: 'conv-123',
          page: '1',
          limit: '50',
        })
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockResponse,
        'Mensajes obtenidos exitosamente'
      );
    });
  });

  describe('updateMensaje', () => {
    it('debería actualizar un mensaje exitosamente', async () => {
      const req = mockReq({
        params: { id: 'msg-123' },
        body: {
          contenido: 'Mensaje editado',
        },
      });
      const res = mockRes();

      const mockMensaje = {
        _id: 'msg-123',
        contenido: 'Mensaje editado',
        editado: true,
        fechaEdicion: new Date(),
      };

      mockChatService.actualizarMensaje.mockResolvedValue(mockMensaje);

      await chatController.updateMensaje(req as Request, res as Response);

      expect(mockChatService.actualizarMensaje).toHaveBeenCalledWith(
        'msg-123',
        { contenido: 'Mensaje editado' },
        'user-123'
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockMensaje,
        'Mensaje actualizado exitosamente'
      );
    });
  });

  describe('marcarComoLeido', () => {
    it('debería marcar mensajes como leídos', async () => {
      const req = mockReq({
        body: {
          conversacionId: 'conv-123',
          mensajeId: 'msg-123',
        },
      });
      const res = mockRes();

      mockChatService.marcarComoLeido.mockResolvedValue();

      await chatController.marcarComoLeido(req as Request, res as Response);

      expect(mockChatService.marcarComoLeido).toHaveBeenCalledWith(
        'conv-123',
        'msg-123',
        'user-123'
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        null,
        'Mensajes marcados como leídos'
      );
    });
  });

  describe('agregarReaccion', () => {
    it('debería agregar una reacción a un mensaje', async () => {
      const req = mockReq({
        params: { mensajeId: 'msg-123' },
        body: { emoji: '👍' },
      });
      const res = mockRes();

      const mockMensaje = {
        _id: 'msg-123',
        reacciones: [
          { userId: 'user-123', emoji: '👍', fecha: new Date() },
        ],
      };

      mockChatService.agregarReaccion.mockResolvedValue(mockMensaje);

      await chatController.agregarReaccion(req as Request, res as Response);

      expect(mockChatService.agregarReaccion).toHaveBeenCalledWith(
        'msg-123',
        '👍',
        'user-123'
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockMensaje,
        'Reacción agregada exitosamente'
      );
    });
  });

  describe('agregarParticipante', () => {
    it('debería agregar un participante a la conversación', async () => {
      const req = mockReq({
        params: { id: 'conv-123' },
        body: { participanteId: 'user-456' },
      });
      const res = mockRes();

      const mockConversacion = {
        _id: 'conv-123',
        participantes: ['user-123', 'user-456'],
      };

      mockChatService.agregarParticipante.mockResolvedValue(mockConversacion);

      await chatController.agregarParticipante(req as Request, res as Response);

      expect(mockChatService.agregarParticipante).toHaveBeenCalledWith(
        'conv-123',
        'user-456',
        'user-123'
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockConversacion,
        'Participante agregado exitosamente'
      );
    });
  });

  describe('getEstadisticas', () => {
    it('debería obtener estadísticas del chat', async () => {
      const req = mockReq();
      const res = mockRes();

      const mockEstadisticas = {
        totalConversaciones: 10,
        conversacionesActivas: 8,
        totalMensajes: 150,
        mensajesHoy: 25,
        usuariosEnLinea: 5,
      };

      mockChatService.getEstadisticas.mockResolvedValue(mockEstadisticas);

      await chatController.getEstadisticas(req as Request, res as Response);

      expect(mockChatService.getEstadisticas).toHaveBeenCalled();
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        res,
        mockEstadisticas,
        'Estadísticas obtenidas exitosamente'
      );
    });
  });
});