import { TipoConversacion, TipoMensaje, EstadoMensaje } from '../models/chat.models';

// DTOs para crear entidades
export interface CreateConversacionDTO {
  tipo: TipoConversacion;
  nombre?: string;
  descripcion?: string;
  participantes: string[];
  configuracion?: {
    notificacionesHabilitadas?: boolean;
    soloAdminsEnvianMensajes?: boolean;
  };
}

export interface CreateMensajeDTO {
  conversacionId: string;
  contenido: string;
  tipo?: TipoMensaje;
  archivosAdjuntos?: {
    nombre: string;
    url: string;
    tipo: string;
    tamaño: number;
  }[];
  mensajeReferencia?: string;
}

export interface UpdateMensajeDTO {
  contenido: string;
}

export interface UpdateConversacionDTO {
  nombre?: string;
  descripcion?: string;
  configuracion?: {
    notificacionesHabilitadas?: boolean;
    soloAdminsEnvianMensajes?: boolean;
  };
}

// DTOs para respuestas
export interface ConversacionResponse {
  _id: string;
  tipo: TipoConversacion;
  nombre?: string;
  descripcion?: string;
  participantes: ParticipanteInfo[];
  creadorId: string;
  ultimoMensaje?: {
    contenido: string;
    fecha: Date;
    autorId: string;
    autorNombre?: string;
  };
  configuracion: {
    notificacionesHabilitadas: boolean;
    soloAdminsEnvianMensajes: boolean;
  };
  admins: string[];
  activa: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  mensajesNoLeidos?: number;
}

export interface MensajeResponse {
  _id: string;
  conversacionId: string;
  autorId: string;
  autorNombre?: string;
  autorAvatar?: string;
  contenido: string;
  tipo: TipoMensaje;
  archivosAdjuntos?: {
    nombre: string;
    url: string;
    tipo: string;
    tamaño: number;
  }[];
  estado: EstadoMensaje;
  editado: boolean;
  fechaEdicion?: Date;
  mensajeReferencia?: MensajeReferenciaInfo;
  reacciones: {
    userId: string;
    emoji: string;
    fecha: Date;
  }[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface ParticipanteInfo {
  id: string;
  nombre: string;
  apellido: string;
  avatar?: string;
  rol: string;
  esAdmin?: boolean;
  ultimaConexion?: Date;
  enLinea?: boolean;
}

export interface MensajeReferenciaInfo {
  _id: string;
  autorId: string;
  autorNombre: string;
  contenido: string;
  tipo: TipoMensaje;
}

// Parámetros de consulta
export interface ConversacionQueryParams {
  page?: number;
  limit?: number;
  tipo?: TipoConversacion;
  busqueda?: string;
  activa?: boolean;
  orderBy?: 'fechaCreacion' | 'fechaActualizacion' | 'ultimoMensaje';
  order?: 'asc' | 'desc';
}

export interface MensajeQueryParams {
  page?: number;
  limit?: number;
  conversacionId: string;
  fechaDesde?: string;
  fechaHasta?: string;
  tipo?: TipoMensaje;
  autorId?: string;
  busqueda?: string;
  orderBy?: 'fechaCreacion';
  order?: 'asc' | 'desc';
}

// Respuestas paginadas
export interface ConversacionesResponse {
  conversaciones: ConversacionResponse[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MensajesResponse {
  mensajes: MensajeResponse[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Eventos de Socket.IO
export interface SocketEvents {
  // Eventos del cliente al servidor
  'join_conversation': (conversacionId: string) => void;
  'leave_conversation': (conversacionId: string) => void;
  'send_message': (data: CreateMensajeDTO) => void;
  'mark_as_read': (data: { conversacionId: string; mensajeId: string }) => void;
  'typing_start': (conversacionId: string) => void;
  'typing_stop': (conversacionId: string) => void;
  'add_reaction': (data: { mensajeId: string; emoji: string }) => void;
  'remove_reaction': (data: { mensajeId: string; emoji: string }) => void;

  // Eventos del servidor al cliente
  'new_message': (mensaje: MensajeResponse) => void;
  'message_updated': (mensaje: MensajeResponse) => void;
  'message_deleted': (data: { mensajeId: string; conversacionId: string }) => void;
  'conversation_updated': (conversacion: ConversacionResponse) => void;
  'user_typing': (data: { userId: string; userName: string; conversacionId: string }) => void;
  'user_stopped_typing': (data: { userId: string; conversacionId: string }) => void;
  'message_read': (data: { conversacionId: string; mensajeId: string; userId: string }) => void;
  'reaction_added': (data: { mensajeId: string; userId: string; emoji: string }) => void;
  'reaction_removed': (data: { mensajeId: string; userId: string; emoji: string }) => void;
  'user_joined': (data: { conversacionId: string; userId: string }) => void;
  'user_left': (data: { conversacionId: string; userId: string }) => void;
  'error': (error: { message: string; code?: string }) => void;
}

// Estados del chat
export interface UsuarioEnLinea {
  userId: string;
  socketId: string;
  conversaciones: string[];
  ultimaActividad: Date;
}

export interface UsuarioEscribiendo {
  userId: string;
  userName: string;
  conversacionId: string;
  timestamp: Date;
}

// Configuración del chat
export interface ChatConfig {
  maxMensajeLength: number;
  maxArchivosAdjuntos: number;
  maxTamañoArchivo: number;
  tiposArchivosPermitidos: string[];
  timeoutEscribiendo: number;
  maxParticipantesGrupo: number;
}

// Estadísticas del chat
export interface EstadisticasChat {
  totalConversaciones: number;
  conversacionesActivas: number;
  totalMensajes: number;
  mensajesHoy: number;
  usuariosEnLinea: number;
  conversacionesMasActivas: {
    _id: string;
    nombre?: string;
    tipo: TipoConversacion;
    totalMensajes: number;
  }[];
}

// Filtros avanzados
export interface FiltrosConversacion {
  participante?: string;
  conMensajesNoLeidos?: boolean;
  ultimaActividad?: {
    desde?: Date;
    hasta?: Date;
  };
  tieneArchivos?: boolean;
}

export interface FiltrosMensaje {
  conArchivos?: boolean;
  editados?: boolean;
  conReacciones?: boolean;
  tipoArchivo?: string;
}

// Notificaciones
export interface NotificacionChat {
  id: string;
  userId: string;
  conversacionId: string;
  mensajeId: string;
  tipo: 'NUEVO_MENSAJE' | 'MENCION' | 'NUEVO_PARTICIPANTE';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: Date;
}