import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponseHandler } from '../utils/responses';
import logger from '../utils/logger';
import chatService from '../services/chat.service';
import {
  CreateConversacionDTO,
  CreateMensajeDTO,
  UpdateConversacionDTO,
  UpdateMensajeDTO,
  ConversacionQueryParams,
  MensajeQueryParams
} from '../types/chat.types';

class ChatController {
  // ==================== CONVERSACIONES ====================

  /**
   * Crear una nueva conversación
   */
  async createConversacion(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const createData: CreateConversacionDTO = req.body;

      const nuevaConversacion = await chatService.createConversacion(createData, userId);

      logger.info(`Conversación creada: ${nuevaConversacion._id} por usuario ${userId}`);
      return ApiResponseHandler.created(res, nuevaConversacion, 'Conversación creada exitosamente');

    } catch (error: any) {
      logger.error('Error al crear conversación:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener conversaciones del usuario
   */
  async getConversaciones(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const queryParams = req.query as unknown as ConversacionQueryParams;

      const resultado = await chatService.getConversacionesUsuario(userId, queryParams);

      return ApiResponseHandler.success(res, resultado, 'Conversaciones obtenidas exitosamente');

    } catch (error: any) {
      logger.error('Error al obtener conversaciones:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener una conversación específica
   */
  async getConversacionById(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { id } = req.params;
      const userId = req.user!.id;

      const conversacion = await chatService.getConversacionById(id, userId);

      return ApiResponseHandler.success(res, conversacion, 'Conversación obtenida exitosamente');

    } catch (error: any) {
      logger.error('Error al obtener conversación:', error);

      if (error.message.includes('no encontrada') || error.message.includes('no tienes acceso')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Actualizar una conversación
   */
  async updateConversacion(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { id } = req.params;
      const userId = req.user!.id;
      const updateData: UpdateConversacionDTO = req.body;

      const conversacionActualizada = await chatService.updateConversacion(id, updateData, userId);

      logger.info(`Conversación actualizada: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, conversacionActualizada, 'Conversación actualizada exitosamente');

    } catch (error: any) {
      logger.error('Error al actualizar conversación:', error);

      if (error.message.includes('no encontrada')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      if (error.message.includes('no tienes permisos')) {
        return ApiResponseHandler.forbidden(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Agregar participante a conversación
   */
  async agregarParticipante(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { id } = req.params;
      const { participanteId } = req.body;
      const userId = req.user!.id;

      const conversacionActualizada = await chatService.agregarParticipante(id, participanteId, userId);

      logger.info(`Participante ${participanteId} agregado a conversación ${id} por ${userId}`);
      return ApiResponseHandler.success(res, conversacionActualizada, 'Participante agregado exitosamente');

    } catch (error: any) {
      logger.error('Error al agregar participante:', error);

      if (error.message.includes('no encontrada') || error.message.includes('no encontrado')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      if (error.message.includes('no tienes permisos')) {
        return ApiResponseHandler.forbidden(res, error.message);
      }

      if (error.message.includes('ya está en la conversación')) {
        return ApiResponseHandler.conflict(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Remover participante de conversación
   */
  async removerParticipante(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { id, participanteId } = req.params;
      const userId = req.user!.id;

      const conversacionActualizada = await chatService.removerParticipante(id, participanteId, userId);

      logger.info(`Participante ${participanteId} removido de conversación ${id} por ${userId}`);
      return ApiResponseHandler.success(res, conversacionActualizada, 'Participante removido exitosamente');

    } catch (error: any) {
      logger.error('Error al remover participante:', error);

      if (error.message.includes('no encontrada')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      if (error.message.includes('no tienes permisos') || error.message.includes('no puede salir')) {
        return ApiResponseHandler.forbidden(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // ==================== MENSAJES ====================

  /**
   * Enviar un mensaje
   */
  async enviarMensaje(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const userId = req.user!.id;
      const createData: CreateMensajeDTO = req.body;

      // Agregar archivos subidos si existen
      if (req.uploadedFiles?.images || req.uploadedFiles?.videos || req.uploadedFiles?.files) {
        const archivosAdjuntos: any[] = [];

        if (req.uploadedFiles.images) {
          archivosAdjuntos.push(...req.uploadedFiles.images.map((img: any) => ({
            nombre: img.original_filename,
            url: img.secure_url,
            tipo: img.format,
            tamaño: img.bytes
          })));
        }

        if (req.uploadedFiles.videos) {
          archivosAdjuntos.push(...req.uploadedFiles.videos.map((vid: any) => ({
            nombre: vid.original_filename,
            url: vid.secure_url,
            tipo: vid.format,
            tamaño: vid.bytes
          })));
        }

        if (req.uploadedFiles.files) {
          archivosAdjuntos.push(...req.uploadedFiles.files.map((file: any) => ({
            nombre: file.original_filename,
            url: file.secure_url,
            tipo: file.format,
            tamaño: file.bytes
          })));
        }

        createData.archivosAdjuntos = archivosAdjuntos;
      }

      const nuevoMensaje = await chatService.enviarMensaje(createData, userId);

      logger.info(`Mensaje enviado por usuario ${userId} en conversación ${createData.conversacionId}`);
      return ApiResponseHandler.created(res, nuevoMensaje, 'Mensaje enviado exitosamente');

    } catch (error: any) {
      logger.error('Error al enviar mensaje:', error);

      if (error.message.includes('no encontrada') || error.message.includes('no tienes acceso')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      if (error.message.includes('Solo los administradores')) {
        return ApiResponseHandler.forbidden(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener mensajes de una conversación
   */
  async getMensajes(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { conversacionId } = req.params;
      const userId = req.user!.id;
      const queryParams = {
        ...req.query,
        conversacionId
      } as unknown as MensajeQueryParams;

      const resultado = await chatService.getMensajes(conversacionId, userId, queryParams);

      return ApiResponseHandler.success(res, resultado, 'Mensajes obtenidos exitosamente');

    } catch (error: any) {
      logger.error('Error al obtener mensajes:', error);

      if (error.message.includes('no encontrada') || error.message.includes('no tienes acceso')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Actualizar un mensaje
   */
  async updateMensaje(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { id } = req.params;
      const userId = req.user!.id;
      const updateData: UpdateMensajeDTO = req.body;

      const mensajeActualizado = await chatService.actualizarMensaje(id, updateData, userId);

      logger.info(`Mensaje actualizado: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, mensajeActualizado, 'Mensaje actualizado exitosamente');

    } catch (error: any) {
      logger.error('Error al actualizar mensaje:', error);

      if (error.message.includes('no encontrado') || error.message.includes('no tienes permisos')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Eliminar un mensaje
   */
  async deleteMensaje(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { id } = req.params;
      const userId = req.user!.id;

      await chatService.eliminarMensaje(id, userId);

      logger.info(`Mensaje eliminado: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, null, 'Mensaje eliminado exitosamente');

    } catch (error: any) {
      logger.error('Error al eliminar mensaje:', error);

      if (error.message.includes('no encontrado') || error.message.includes('no tienes permisos')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Marcar mensajes como leídos
   */
  async marcarComoLeido(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { conversacionId, mensajeId } = req.body;
      const userId = req.user!.id;

      await chatService.marcarComoLeido(conversacionId, mensajeId, userId);

      return ApiResponseHandler.success(res, null, 'Mensajes marcados como leídos');

    } catch (error: any) {
      logger.error('Error al marcar como leído:', error);

      if (error.message.includes('no encontrada')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Agregar reacción a mensaje
   */
  async agregarReaccion(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { mensajeId } = req.params;
      const { emoji } = req.body;
      const userId = req.user!.id;

      const mensajeActualizado = await chatService.agregarReaccion(mensajeId, emoji, userId);

      return ApiResponseHandler.success(res, mensajeActualizado, 'Reacción agregada exitosamente');

    } catch (error: any) {
      logger.error('Error al agregar reacción:', error);

      if (error.message.includes('no encontrado') || error.message.includes('no tienes acceso')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  /**
   * Remover reacción de mensaje
   */
  async removerReaccion(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      const { mensajeId } = req.params;
      const userId = req.user!.id;

      const mensajeActualizado = await chatService.removerReaccion(mensajeId, userId);

      return ApiResponseHandler.success(res, mensajeActualizado, 'Reacción removida exitosamente');

    } catch (error: any) {
      logger.error('Error al remover reacción:', error);

      if (error.message.includes('no encontrado')) {
        return ApiResponseHandler.notFound(res, error.message);
      }

      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas del chat
   */
  async getEstadisticas(req: Request, res: Response) {
    try {
      const estadisticas = await chatService.getEstadisticas();

      return ApiResponseHandler.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');

    } catch (error: any) {
      logger.error('Error al obtener estadísticas:', error);
      return ApiResponseHandler.error(res, error.message || 'Error interno del servidor', 500);
    }
  }
}

export default new ChatController();