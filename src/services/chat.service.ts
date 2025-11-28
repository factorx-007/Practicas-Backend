import { Conversacion, Mensaje, EstadoLectura, TipoConversacion, TipoMensaje, EstadoMensaje } from '../models/chat.models';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import {
  CreateConversacionDTO,
  CreateMensajeDTO,
  UpdateConversacionDTO,
  UpdateMensajeDTO,
  ConversacionResponse,
  MensajeResponse,
  ConversacionQueryParams,
  MensajeQueryParams,
  ParticipanteInfo,
  ConversacionesResponse,
  MensajesResponse,
  EstadisticasChat
} from '../types/chat.types';

export class ChatService {
  // ==================== CONVERSACIONES ====================

  /**
   * Crear una nueva conversación
   */
  async createConversacion(data: CreateConversacionDTO, creadorId: string): Promise<ConversacionResponse> {
    try {
      // Validar que el creador esté en participantes
      if (!data.participantes.includes(creadorId)) {
        data.participantes.push(creadorId);
      }

      // Para conversaciones privadas, validar que solo hay 2 participantes
      if (data.tipo === TipoConversacion.PRIVADA && data.participantes.length !== 2) {
        throw new Error('Las conversaciones privadas deben tener exactamente 2 participantes');
      }

      // Verificar si ya existe una conversación privada entre estos usuarios
      if (data.tipo === TipoConversacion.PRIVADA) {
        const conversacionExistente = await Conversacion.findOne({
          tipo: TipoConversacion.PRIVADA,
          participantes: { $all: data.participantes },
          activa: true
        });

        if (conversacionExistente) {
          return this.formatConversacion(conversacionExistente);
        }
      }

      // Validar que todos los participantes existen en PostgreSQL
      const usuarios = await prisma.usuario.findMany({
        where: { id: { in: data.participantes } },
        select: { id: true, nombre: true, apellido: true, avatar: true, rol: true }
      });

      if (usuarios.length !== data.participantes.length) {
        throw new Error('Algunos participantes no existen');
      }

      const nuevaConversacion = new Conversacion({
        ...data,
        creadorId,
        admins: data.tipo === TipoConversacion.GRUPO ? [creadorId] : []
      });

      const conversacionGuardada = await nuevaConversacion.save();

      logger.info(`Conversación creada: ${conversacionGuardada._id} por usuario ${creadorId}`);
      return this.formatConversacion(conversacionGuardada);

    } catch (error) {
      logger.error('Error al crear conversación:', error);
      throw error;
    }
  }

  /**
   * Obtener conversaciones del usuario con paginación
   */
  async getConversacionesUsuario(
    userId: string,
    params: ConversacionQueryParams
  ): Promise<ConversacionesResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        tipo,
        busqueda,
        activa = true,
        orderBy = 'ultimoMensaje',
        order = 'desc'
      } = params;

      const offset = (page - 1) * limit;

      // Construir filtros
      const filtros: any = {
        participantes: userId,
        activa
      };

      if (tipo) {
        filtros.tipo = tipo;
      }

      if (busqueda) {
        filtros.$or = [
          { nombre: { $regex: busqueda, $options: 'i' } },
          { descripcion: { $regex: busqueda, $options: 'i' } }
        ];
      }

      // Configurar ordenamiento
      let sortField = 'ultimoMensaje.fecha';
      if (orderBy === 'fechaCreacion') sortField = 'fechaCreacion';
      if (orderBy === 'fechaActualizacion') sortField = 'fechaActualizacion';

      const sortOrder = order === 'asc' ? 1 : -1;

      const [conversaciones, total] = await Promise.all([
        Conversacion.find(filtros)
          .sort({ [sortField]: sortOrder })
          .skip(offset)
          .limit(limit)
          .lean(),
        Conversacion.countDocuments(filtros)
      ]);

      const conversacionesFormateadas = await Promise.all(
        conversaciones.map(conv => this.formatConversacion(conv))
      );

      const totalPages = Math.ceil(total / limit);

      return {
        conversaciones: conversacionesFormateadas,
        pagination: {
          total,
          page,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error al obtener conversaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener una conversación específica
   */
  async getConversacionById(conversacionId: string, userId: string): Promise<ConversacionResponse> {
    try {
      const conversacion = await Conversacion.findOne({
        _id: conversacionId,
        participantes: userId,
        activa: true
      });

      if (!conversacion) {
        throw new Error('Conversación no encontrada o no tienes acceso');
      }

      return this.formatConversacion(conversacion);

    } catch (error) {
      logger.error('Error al obtener conversación:', error);
      throw error;
    }
  }

  /**
   * Actualizar una conversación
   */
  async updateConversacion(
    conversacionId: string,
    data: UpdateConversacionDTO,
    userId: string
  ): Promise<ConversacionResponse> {
    try {
      const conversacion = await Conversacion.findOne({
        _id: conversacionId,
        participantes: userId,
        activa: true
      });

      if (!conversacion) {
        throw new Error('Conversación no encontrada');
      }

      // Solo admins pueden actualizar grupos
      if (conversacion.tipo === TipoConversacion.GRUPO && !conversacion.admins.includes(userId)) {
        throw new Error('No tienes permisos para actualizar este grupo');
      }

      Object.assign(conversacion, data);
      const conversacionActualizada = await conversacion.save();

      logger.info(`Conversación actualizada: ${conversacionId} por usuario ${userId}`);
      return this.formatConversacion(conversacionActualizada);

    } catch (error) {
      logger.error('Error al actualizar conversación:', error);
      throw error;
    }
  }

  /**
   * Agregar participante a conversación
   */
  async agregarParticipante(conversacionId: string, nuevoParticipante: string, userId: string): Promise<ConversacionResponse> {
    try {
      const conversacion = await Conversacion.findOne({
        _id: conversacionId,
        activa: true
      });

      if (!conversacion) {
        throw new Error('Conversación no encontrada');
      }

      // Solo para grupos
      if (conversacion.tipo !== TipoConversacion.GRUPO) {
        throw new Error('Solo se pueden agregar participantes a grupos');
      }

      // Solo admins pueden agregar participantes
      if (!conversacion.admins.includes(userId)) {
        throw new Error('No tienes permisos para agregar participantes');
      }

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id: nuevoParticipante }
      });

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que no esté ya en la conversación
      if (conversacion.participantes.includes(nuevoParticipante)) {
        throw new Error('El usuario ya está en la conversación');
      }

      conversacion.participantes.push(nuevoParticipante);
      const conversacionActualizada = await conversacion.save();

      logger.info(`Participante ${nuevoParticipante} agregado a conversación ${conversacionId}`);
      return this.formatConversacion(conversacionActualizada);

    } catch (error) {
      logger.error('Error al agregar participante:', error);
      throw error;
    }
  }

  /**
   * Remover participante de conversación
   */
  async removerParticipante(conversacionId: string, participanteId: string, userId: string): Promise<ConversacionResponse> {
    try {
      const conversacion = await Conversacion.findOne({
        _id: conversacionId,
        activa: true
      });

      if (!conversacion) {
        throw new Error('Conversación no encontrada');
      }

      // Solo para grupos
      if (conversacion.tipo !== TipoConversacion.GRUPO) {
        throw new Error('Solo se pueden remover participantes de grupos');
      }

      // Solo admins o el propio usuario pueden remover
      if (!conversacion.admins.includes(userId) && userId !== participanteId) {
        throw new Error('No tienes permisos para remover participantes');
      }

      // No permitir que el creador se remueva a sí mismo
      if (participanteId === conversacion.creadorId) {
        throw new Error('El creador no puede salir del grupo');
      }

      conversacion.participantes = conversacion.participantes.filter(id => id !== participanteId);
      conversacion.admins = conversacion.admins.filter(id => id !== participanteId);

      const conversacionActualizada = await conversacion.save();

      logger.info(`Participante ${participanteId} removido de conversación ${conversacionId}`);
      return this.formatConversacion(conversacionActualizada);

    } catch (error) {
      logger.error('Error al remover participante:', error);
      throw error;
    }
  }

  // ==================== MENSAJES ====================

  /**
   * Enviar un mensaje
   */
  async enviarMensaje(data: CreateMensajeDTO, autorId: string): Promise<MensajeResponse> {
    try {
      // Verificar que la conversación existe y el usuario es participante
      const conversacion = await Conversacion.findOne({
        _id: data.conversacionId,
        participantes: autorId,
        activa: true
      });

      if (!conversacion) {
        throw new Error('Conversación no encontrada o no tienes acceso');
      }

      // Verificar permisos para enviar mensajes
      if (conversacion.configuracion.soloAdminsEnvianMensajes &&
          !conversacion.admins.includes(autorId)) {
        throw new Error('Solo los administradores pueden enviar mensajes en este grupo');
      }

      const nuevoMensaje = new Mensaje({
        ...data,
        autorId,
        tipo: data.tipo || TipoMensaje.TEXTO
      });

      const mensajeGuardado = await nuevoMensaje.save();

      // Actualizar último mensaje en conversación
      conversacion.ultimoMensaje = {
        contenido: mensajeGuardado.contenido,
        fecha: mensajeGuardado.fechaCreacion,
        autorId: autorId
      };
      await conversacion.save();

      logger.info(`Mensaje enviado en conversación ${data.conversacionId} por usuario ${autorId}`);
      return this.formatMensaje(mensajeGuardado);

    } catch (error) {
      logger.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtener mensajes de una conversación
   */
  async getMensajes(
    conversacionId: string,
    userId: string,
    params: MensajeQueryParams
  ): Promise<MensajesResponse> {
    try {
      // Verificar acceso a la conversación
      const conversacion = await Conversacion.findOne({
        _id: conversacionId,
        participantes: userId,
        activa: true
      });

      if (!conversacion) {
        throw new Error('Conversación no encontrada o no tienes acceso');
      }

      const {
        page = 1,
        limit = 50,
        fechaDesde,
        fechaHasta,
        tipo,
        autorId,
        busqueda,
        orderBy = 'fechaCreacion',
        order = 'desc'
      } = params;

      const offset = (page - 1) * limit;

      // Construir filtros
      const filtros: any = { conversacionId };

      if (fechaDesde || fechaHasta) {
        filtros.fechaCreacion = {};
        if (fechaDesde) filtros.fechaCreacion.$gte = new Date(fechaDesde);
        if (fechaHasta) filtros.fechaCreacion.$lte = new Date(fechaHasta);
      }

      if (tipo) filtros.tipo = tipo;
      if (autorId) filtros.autorId = autorId;
      if (busqueda) {
        filtros.contenido = { $regex: busqueda, $options: 'i' };
      }

      const sortOrder = order === 'asc' ? 1 : -1;

      const [mensajes, total] = await Promise.all([
        Mensaje.find(filtros)
          .sort({ [orderBy]: sortOrder })
          .skip(offset)
          .limit(limit)
          .lean(),
        Mensaje.countDocuments(filtros)
      ]);

      const mensajesFormateados = await Promise.all(
        mensajes.map(msg => this.formatMensaje(msg))
      );

      const totalPages = Math.ceil(total / limit);

      return {
        mensajes: mensajesFormateados,
        pagination: {
          total,
          page,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error al obtener mensajes:', error);
      throw error;
    }
  }

  /**
   * Actualizar un mensaje
   */
  async actualizarMensaje(
    mensajeId: string,
    data: UpdateMensajeDTO,
    userId: string
  ): Promise<MensajeResponse> {
    try {
      const mensaje = await Mensaje.findOne({
        _id: mensajeId,
        autorId: userId
      });

      if (!mensaje) {
        throw new Error('Mensaje no encontrado o no tienes permisos');
      }

      mensaje.contenido = data.contenido;
      mensaje.editado = true;
      mensaje.fechaEdicion = new Date();

      const mensajeActualizado = await mensaje.save();

      logger.info(`Mensaje actualizado: ${mensajeId} por usuario ${userId}`);
      return this.formatMensaje(mensajeActualizado);

    } catch (error) {
      logger.error('Error al actualizar mensaje:', error);
      throw error;
    }
  }

  /**
   * Eliminar un mensaje
   */
  async eliminarMensaje(mensajeId: string, userId: string): Promise<void> {
    try {
      const mensaje = await Mensaje.findOne({
        _id: mensajeId,
        autorId: userId
      });

      if (!mensaje) {
        throw new Error('Mensaje no encontrado o no tienes permisos');
      }

      await Mensaje.deleteOne({ _id: mensajeId });

      logger.info(`Mensaje eliminado: ${mensajeId} por usuario ${userId}`);

    } catch (error) {
      logger.error('Error al eliminar mensaje:', error);
      throw error;
    }
  }

  /**
   * Marcar mensajes como leídos
   */
  async marcarComoLeido(conversacionId: string, mensajeId: string, userId: string): Promise<void> {
    try {
      // Verificar acceso a la conversación
      const conversacion = await Conversacion.findOne({
        _id: conversacionId,
        participantes: userId,
        activa: true
      });

      if (!conversacion) {
        throw new Error('Conversación no encontrada');
      }

      // Actualizar o crear estado de lectura
      await EstadoLectura.findOneAndUpdate(
        { conversacionId, userId },
        {
          ultimoMensajeLeido: mensajeId,
          fechaUltimaLectura: new Date()
        },
        { upsert: true }
      );

      // Actualizar estado del mensaje
      await Mensaje.updateOne(
        { _id: mensajeId },
        { estado: EstadoMensaje.LEIDO }
      );

    } catch (error) {
      logger.error('Error al marcar como leído:', error);
      throw error;
    }
  }

  /**
   * Agregar reacción a mensaje
   */
  async agregarReaccion(mensajeId: string, emoji: string, userId: string): Promise<MensajeResponse> {
    try {
      const mensaje = await Mensaje.findById(mensajeId);

      if (!mensaje) {
        throw new Error('Mensaje no encontrado');
      }

      // Verificar acceso a la conversación
      const conversacion = await Conversacion.findOne({
        _id: mensaje.conversacionId,
        participantes: userId,
        activa: true
      });

      if (!conversacion) {
        throw new Error('No tienes acceso a esta conversación');
      }

      // Remover reacción anterior del usuario si existe
      mensaje.reacciones = mensaje.reacciones.filter(r => r.userId !== userId);

      // Agregar nueva reacción
      mensaje.reacciones.push({
        userId,
        emoji,
        fecha: new Date()
      });

      const mensajeActualizado = await mensaje.save();
      return this.formatMensaje(mensajeActualizado);

    } catch (error) {
      logger.error('Error al agregar reacción:', error);
      throw error;
    }
  }

  /**
   * Remover reacción de mensaje
   */
  async removerReaccion(mensajeId: string, userId: string): Promise<MensajeResponse> {
    try {
      const mensaje = await Mensaje.findById(mensajeId);

      if (!mensaje) {
        throw new Error('Mensaje no encontrado');
      }

      // Remover reacción del usuario
      mensaje.reacciones = mensaje.reacciones.filter(r => r.userId !== userId);

      const mensajeActualizado = await mensaje.save();
      return this.formatMensaje(mensajeActualizado);

    } catch (error) {
      logger.error('Error al remover reacción:', error);
      throw error;
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear conversación para respuesta
   */
  private async formatConversacion(conversacion: any): Promise<ConversacionResponse> {
    // Obtener información de participantes
    const participantesInfo = await this.getParticipantesInfo(conversacion.participantes);

    // Obtener mensajes no leídos (esto sería opcional)
    const mensajesNoLeidos = 0; // TODO: Implementar conteo real

    return {
      _id: conversacion._id.toString(),
      tipo: conversacion.tipo,
      nombre: conversacion.nombre,
      descripcion: conversacion.descripcion,
      participantes: participantesInfo,
      creadorId: conversacion.creadorId,
      ultimoMensaje: conversacion.ultimoMensaje,
      configuracion: conversacion.configuracion,
      admins: conversacion.admins,
      activa: conversacion.activa,
      fechaCreacion: conversacion.fechaCreacion,
      fechaActualizacion: conversacion.fechaActualizacion,
      mensajesNoLeidos
    };
  }

  /**
   * Formatear mensaje para respuesta
   */
  private async formatMensaje(mensaje: any): Promise<MensajeResponse> {
    // Obtener información del autor
    const autor = await prisma.usuario.findUnique({
      where: { id: mensaje.autorId },
      select: { nombre: true, apellido: true, avatar: true }
    });

    // Obtener información del mensaje referenciado si existe
    let mensajeReferencia = undefined;
    if (mensaje.mensajeReferencia) {
      const msgRef = await Mensaje.findById(mensaje.mensajeReferencia);
      if (msgRef) {
        const autorRef = await prisma.usuario.findUnique({
          where: { id: msgRef.autorId },
          select: { nombre: true, apellido: true }
        });

        mensajeReferencia = {
          _id: msgRef._id.toString(),
          autorId: msgRef.autorId,
          autorNombre: autorRef ? `${autorRef.nombre} ${autorRef.apellido}` : 'Usuario',
          contenido: msgRef.contenido,
          tipo: msgRef.tipo
        };
      }
    }

    return {
      _id: mensaje._id.toString(),
      conversacionId: mensaje.conversacionId,
      autorId: mensaje.autorId,
      autorNombre: autor ? `${autor.nombre} ${autor.apellido}` : 'Usuario',
      autorAvatar: autor?.avatar || undefined,
      contenido: mensaje.contenido,
      tipo: mensaje.tipo,
      archivosAdjuntos: mensaje.archivosAdjuntos,
      estado: mensaje.estado,
      editado: mensaje.editado,
      fechaEdicion: mensaje.fechaEdicion,
      mensajeReferencia,
      reacciones: mensaje.reacciones,
      fechaCreacion: mensaje.fechaCreacion,
      fechaActualizacion: mensaje.fechaActualizacion
    };
  }

  /**
   * Obtener información de participantes
   */
  private async getParticipantesInfo(participantesIds: string[]): Promise<ParticipanteInfo[]> {
    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: participantesIds } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        avatar: true,
        rol: true
      }
    });

    return usuarios.map(usuario => ({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      avatar: usuario.avatar || undefined,
      rol: usuario.rol
    }));
  }

  /**
   * Obtener estadísticas del chat
   */
  async getEstadisticas(): Promise<EstadisticasChat> {
    try {
      const [
        totalConversaciones,
        conversacionesActivas,
        totalMensajes,
        mensajesHoy
      ] = await Promise.all([
        Conversacion.countDocuments(),
        Conversacion.countDocuments({ activa: true }),
        Mensaje.countDocuments(),
        Mensaje.countDocuments({
          fechaCreacion: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        })
      ]);

      return {
        totalConversaciones,
        conversacionesActivas,
        totalMensajes,
        mensajesHoy,
        usuariosEnLinea: 0, // Se actualizará desde Socket.IO
        conversacionesMasActivas: [] // TODO: Implementar agregación
      };

    } catch (error) {
      logger.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

export default new ChatService();