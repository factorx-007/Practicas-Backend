import { Server, Socket } from 'socket.io';
import { jwtUtils } from '../utils/helpers';
import logger from '../utils/logger';
import chatService from '../services/chat.service';
import { CreateMensajeDTO, SocketEvents, UsuarioEnLinea, UsuarioEscribiendo } from '../types/chat.types';

// Estado global del servidor de Socket.IO
const usuariosEnLinea = new Map<string, UsuarioEnLinea>();
const usuariosEscribiendo = new Map<string, UsuarioEscribiendo>();

export class ChatSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupConnection();
  }

  private setupConnection(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Cliente conectado: ${socket.id}`);

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
        logger.warn(`Conexión rechazada - No token: ${socket.id}`);
        socket.emit('error', { message: 'Token de autenticación requerido' });
        socket.disconnect();
        return;
      }

      const payload = jwtUtils.verifyAccessToken(token);

      if (!payload) {
        logger.warn(`Conexión rechazada - Token inválido: ${socket.id}`);
        socket.emit('error', { message: 'Token inválido' });
        socket.disconnect();
        return;
      }

      // Agregar información del usuario al socket
      socket.data.userId = payload.userId;
      socket.data.userEmail = payload.email;

      // Registrar usuario como en línea
      this.registerUserOnline(payload.userId, socket.id);

      logger.info(`Usuario autenticado: ${payload.userId} (${socket.id})`);

    } catch (error) {
      logger.error('Error autenticando usuario:', error);
      socket.emit('error', { message: 'Error de autenticación' });
      socket.disconnect();
    }
  }

  private setupEventHandlers(socket: Socket): void {
    // Unirse a una conversación
    socket.on('join_conversation', (conversacionId: string) => {
      this.handleJoinConversation(socket, conversacionId);
    });

    // Salir de una conversación
    socket.on('leave_conversation', (conversacionId: string) => {
      this.handleLeaveConversation(socket, conversacionId);
    });

    // Enviar mensaje
    socket.on('send_message', async (data: CreateMensajeDTO) => {
      await this.handleSendMessage(socket, data);
    });

    // Marcar como leído
    socket.on('mark_as_read', async (data: { conversacionId: string; mensajeId: string }) => {
      await this.handleMarkAsRead(socket, data);
    });

    // Usuario está escribiendo
    socket.on('typing_start', (conversacionId: string) => {
      this.handleTypingStart(socket, conversacionId);
    });

    // Usuario dejó de escribir
    socket.on('typing_stop', (conversacionId: string) => {
      this.handleTypingStop(socket, conversacionId);
    });

    // Agregar reacción
    socket.on('add_reaction', async (data: { mensajeId: string; emoji: string }) => {
      await this.handleAddReaction(socket, data);
    });

    // Remover reacción
    socket.on('remove_reaction', async (data: { mensajeId: string; emoji: string }) => {
      await this.handleRemoveReaction(socket, data);
    });
  }

  private registerUserOnline(userId: string, socketId: string): void {
    const usuario: UsuarioEnLinea = {
      userId,
      socketId,
      conversaciones: [],
      ultimaActividad: new Date()
    };

    usuariosEnLinea.set(userId, usuario);

    // Notificar a otros usuarios sobre el estado en línea
    this.io.emit('user_online', { userId });
  }

  private async handleJoinConversation(socket: Socket, conversacionId: string): Promise<void> {
    try {
      const userId = socket.data.userId;

      // Verificar acceso a la conversación
      const conversacion = await chatService.getConversacionById(conversacionId, userId);

      // Unirse a la sala de la conversación
      socket.join(conversacionId);

      // Actualizar lista de conversaciones del usuario
      const usuario = usuariosEnLinea.get(userId);
      if (usuario && !usuario.conversaciones.includes(conversacionId)) {
        usuario.conversaciones.push(conversacionId);
      }

      // Notificar a otros participantes
      socket.to(conversacionId).emit('user_joined', {
        conversacionId,
        userId
      });

      logger.info(`Usuario ${userId} se unió a conversación ${conversacionId}`);

    } catch (error) {
      logger.error('Error al unirse a conversación:', error);
      socket.emit('error', { message: 'No se pudo unir a la conversación' });
    }
  }

  private handleLeaveConversation(socket: Socket, conversacionId: string): void {
    try {
      const userId = socket.data.userId;

      // Salir de la sala
      socket.leave(conversacionId);

      // Actualizar lista de conversaciones del usuario
      const usuario = usuariosEnLinea.get(userId);
      if (usuario) {
        usuario.conversaciones = usuario.conversaciones.filter(id => id !== conversacionId);
      }

      // Detener typing si estaba escribiendo
      this.handleTypingStop(socket, conversacionId);

      // Notificar a otros participantes
      socket.to(conversacionId).emit('user_left', {
        conversacionId,
        userId
      });

      logger.info(`Usuario ${userId} salió de conversación ${conversacionId}`);

    } catch (error) {
      logger.error('Error al salir de conversación:', error);
    }
  }

  private async handleSendMessage(socket: Socket, data: CreateMensajeDTO): Promise<void> {
    try {
      const userId = socket.data.userId;

      // Enviar mensaje usando el servicio
      const nuevoMensaje = await chatService.enviarMensaje(data, userId);

      // Emitir mensaje a todos los participantes de la conversación
      this.io.to(data.conversacionId).emit('new_message', nuevoMensaje);

      // Detener typing del usuario que envió el mensaje
      this.handleTypingStop(socket, data.conversacionId);

      logger.info(`Mensaje enviado por ${userId} en conversación ${data.conversacionId}`);

    } catch (error) {
      logger.error('Error al enviar mensaje via socket:', error);
      socket.emit('error', {
        message: 'No se pudo enviar el mensaje',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  private async handleMarkAsRead(socket: Socket, data: { conversacionId: string; mensajeId: string }): Promise<void> {
    try {
      const userId = socket.data.userId;

      await chatService.marcarComoLeido(data.conversacionId, data.mensajeId, userId);

      // Notificar a otros participantes
      socket.to(data.conversacionId).emit('message_read', {
        conversacionId: data.conversacionId,
        mensajeId: data.mensajeId,
        userId
      });

    } catch (error) {
      logger.error('Error al marcar como leído via socket:', error);
      socket.emit('error', { message: 'No se pudo marcar como leído' });
    }
  }

  private handleTypingStart(socket: Socket, conversacionId: string): void {
    try {
      const userId = socket.data.userId;
      const userName = socket.data.userEmail; // Temporalmente usar email

      const typingKey = `${userId}_${conversacionId}`;

      usuariosEscribiendo.set(typingKey, {
        userId,
        userName,
        conversacionId,
        timestamp: new Date()
      });

      // Notificar a otros participantes (excepto al emisor)
      socket.to(conversacionId).emit('user_typing', {
        userId,
        userName,
        conversacionId
      });

      // Auto-stop después de 3 segundos si no se recibe typing_stop
      setTimeout(() => {
        if (usuariosEscribiendo.has(typingKey)) {
          this.handleTypingStop(socket, conversacionId);
        }
      }, 3000);

    } catch (error) {
      logger.error('Error en typing start:', error);
    }
  }

  private handleTypingStop(socket: Socket, conversacionId: string): void {
    try {
      const userId = socket.data.userId;
      const typingKey = `${userId}_${conversacionId}`;

      if (usuariosEscribiendo.has(typingKey)) {
        usuariosEscribiendo.delete(typingKey);

        // Notificar a otros participantes
        socket.to(conversacionId).emit('user_stopped_typing', {
          userId,
          conversacionId
        });
      }

    } catch (error) {
      logger.error('Error en typing stop:', error);
    }
  }

  private async handleAddReaction(socket: Socket, data: { mensajeId: string; emoji: string }): Promise<void> {
    try {
      const userId = socket.data.userId;

      const mensajeActualizado = await chatService.agregarReaccion(data.mensajeId, data.emoji, userId);

      // Notificar a todos los participantes de la conversación
      this.io.to(mensajeActualizado.conversacionId).emit('reaction_added', {
        mensajeId: data.mensajeId,
        userId,
        emoji: data.emoji
      });

    } catch (error) {
      logger.error('Error al agregar reacción via socket:', error);
      socket.emit('error', { message: 'No se pudo agregar la reacción' });
    }
  }

  private async handleRemoveReaction(socket: Socket, data: { mensajeId: string; emoji: string }): Promise<void> {
    try {
      const userId = socket.data.userId;

      const mensajeActualizado = await chatService.removerReaccion(data.mensajeId, userId);

      // Notificar a todos los participantes de la conversación
      this.io.to(mensajeActualizado.conversacionId).emit('reaction_removed', {
        mensajeId: data.mensajeId,
        userId,
        emoji: data.emoji
      });

    } catch (error) {
      logger.error('Error al remover reacción via socket:', error);
      socket.emit('error', { message: 'No se pudo remover la reacción' });
    }
  }

  private handleDisconnect(socket: Socket): void {
    try {
      const userId = socket.data.userId;

      if (userId) {
        // Remover usuario de línea
        usuariosEnLinea.delete(userId);

        // Limpiar typing status
        for (const [key, typing] of usuariosEscribiendo.entries()) {
          if (typing.userId === userId) {
            usuariosEscribiendo.delete(key);

            // Notificar que dejó de escribir
            socket.to(typing.conversacionId).emit('user_stopped_typing', {
              userId,
              conversacionId: typing.conversacionId
            });
          }
        }

        // Notificar que el usuario se desconectó
        this.io.emit('user_offline', { userId });

        logger.info(`Usuario ${userId} desconectado (${socket.id})`);
      }

    } catch (error) {
      logger.error('Error en handleDisconnect:', error);
    }
  }

  // Métodos públicos para estadísticas
  public getUsuariosEnLinea(): number {
    return usuariosEnLinea.size;
  }

  public getUsuariosEscribiendo(): UsuarioEscribiendo[] {
    return Array.from(usuariosEscribiendo.values());
  }
}

// Función para configurar Socket.IO con el chat
export const setupChatSocket = (io: Server): ChatSocketHandler => {
  return new ChatSocketHandler(io);
};