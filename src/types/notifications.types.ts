import { NotificationType } from './common.types';

// Enums específicos para notificaciones
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS'
}

// DTOs para crear notificaciones
export interface CreateNotificationDTO {
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  destinatarioId: string;
  remitenteId?: string;
  prioridad?: NotificationPriority;
  canales?: NotificationChannel[];
  metadata?: Record<string, any>;
  programada?: Date;
  expiresAt?: Date;
  acciones?: NotificationAction[];
}

export interface CreateBulkNotificationDTO {
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  destinatarioIds: string[];
  remitenteId?: string;
  prioridad?: NotificationPriority;
  canales?: NotificationChannel[];
  metadata?: Record<string, any>;
  programada?: Date;
  expiresAt?: Date;
  filtros?: NotificationFilter;
}

export interface UpdateNotificationDTO {
  leida?: boolean;
  estado?: NotificationStatus;
  fechaLectura?: Date;
}

// Interfaces de respuesta
export interface NotificationResponse {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  destinatarioId: string;
  remitenteId?: string;
  remitenteNombre?: string;
  remitenteAvatar?: string;
  estado: NotificationStatus;
  prioridad: NotificationPriority;
  canales: NotificationChannel[];
  leida: boolean;
  fechaLectura?: Date;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  programada?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  acciones?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  texto: string;
  tipo: 'PRIMARY' | 'SECONDARY' | 'DANGER';
  url?: string;
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
}

export interface NotificationFilter {
  roles?: string[];
  ubicaciones?: string[];
  intereses?: string[];
  edadMin?: number;
  edadMax?: number;
  activos?: boolean;
}

// Parámetros de consulta
export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  tipo?: NotificationType;
  estado?: NotificationStatus;
  prioridad?: NotificationPriority;
  leida?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  remitenteId?: string;
  busqueda?: string;
  orderBy?: 'fechaCreacion' | 'fechaActualizacion' | 'prioridad';
  order?: 'asc' | 'desc';
}

// Respuestas paginadas
export interface NotificationsResponse {
  notificaciones: NotificationResponse[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  noLeidas: number;
}

// Estadísticas de notificaciones
export interface NotificationStats {
  total: number;
  noLeidas: number;
  porTipo: Record<NotificationType, number>;
  porEstado: Record<NotificationStatus, number>;
  porPrioridad: Record<NotificationPriority, number>;
  hoy: number;
  estaSemana: number;
  esteMes: number;
}

// Configuración de notificaciones del usuario
export interface UserNotificationSettings {
  userId: string;
  configuracion: {
    [key in NotificationType]: {
      habilitado: boolean;
      canales: NotificationChannel[];
      sonido?: boolean;
      vibration?: boolean;
      horarioDesde?: string; // HH:mm
      horarioHasta?: string; // HH:mm
    };
  };
  noMolestar: boolean;
  horarioNoMolestarDesde?: string;
  horarioNoMolestarHasta?: string;
  diasNoMolestar?: number[]; // 0-6 (domingo a sábado)
  fechaActualizacion: Date;
}

export interface UpdateNotificationSettingsDTO {
  configuracion?: Partial<UserNotificationSettings['configuracion']>;
  noMolestar?: boolean;
  horarioNoMolestarDesde?: string;
  horarioNoMolestarHasta?: string;
  diasNoMolestar?: number[];
}

// Eventos de Socket.IO para notificaciones
export interface NotificationSocketEvents {
  // Eventos del cliente al servidor
  'join_notifications': () => void;
  'leave_notifications': () => void;
  'mark_notification_read': (notificationId: string) => void;
  'mark_all_notifications_read': () => void;
  'delete_notification': (notificationId: string) => void;

  // Eventos del servidor al cliente
  'new_notification': (notification: NotificationResponse) => void;
  'notification_updated': (notification: NotificationResponse) => void;
  'notification_deleted': (data: { notificationId: string }) => void;
  'notifications_marked_read': (data: { count: number }) => void;
  'notification_stats_updated': (stats: NotificationStats) => void;
  'notification_error': (error: { message: string; code?: string }) => void;
}

// Templates de notificaciones
export interface NotificationTemplate {
  id: string;
  nombre: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  variables: string[];
  canales: NotificationChannel[];
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface CreateNotificationTemplateDTO {
  nombre: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  variables?: string[];
  canales?: NotificationChannel[];
  activo?: boolean;
}

// Configuración del sistema de notificaciones
export interface NotificationSystemConfig {
  maxNotificationsPerUser: number;
  notificationRetentionDays: number;
  maxBulkNotifications: number;
  rateLimitPerMinute: number;
  emailRetryAttempts: number;
  pushRetryAttempts: number;
  smsRetryAttempts: number;
  defaultChannels: NotificationChannel[];
  defaultPriority: NotificationPriority;
}

// Logs de notificaciones
export interface NotificationLog {
  id: string;
  notificationId: string;
  canal: NotificationChannel;
  estado: 'ENVIADO' | 'FALLIDO' | 'REINTENTANDO';
  mensaje?: string;
  error?: string;
  intentos: number;
  fechaCreacion: Date;
}

// Métricas de rendimiento
export interface NotificationMetrics {
  totalEnviadas: number;
  totalLeidas: number;
  tasaLectura: number;
  tiempoPromedioLectura: number; // en minutos
  porCanal: Record<NotificationChannel, {
    enviadas: number;
    exitosas: number;
    fallidas: number;
    tasaExito: number;
  }>;
  porTipo: Record<NotificationType, {
    enviadas: number;
    leidas: number;
    tasaLectura: number;
  }>;
  rendimientoPorHora: {
    hora: number;
    enviadas: number;
    leidas: number;
  }[];
}

// Websocket context para notificaciones
export interface NotificationSocketContext {
  userId: string;
  socketId: string;
  joinedNotifications: boolean;
  lastActivity: Date;
  userAgent?: string;
  ipAddress?: string;
}