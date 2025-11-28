import mongoose, { Document, Schema } from 'mongoose';
import { NotificationType } from '../types/common.types';
import {
  NotificationStatus,
  NotificationPriority,
  NotificationChannel
} from '../types/notifications.types';

// Interfaces para TypeScript
export interface INotification extends Document {
  _id: string;
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  destinatarioId: string; // ID de usuario de PostgreSQL
  remitenteId?: string; // ID de usuario de PostgreSQL
  estado: NotificationStatus;
  prioridad: NotificationPriority;
  canales: NotificationChannel[];
  leida: boolean;
  fechaLectura?: Date;
  programada?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  acciones?: {
    id: string;
    texto: string;
    tipo: 'PRIMARY' | 'SECONDARY' | 'DANGER';
    url?: string;
    metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: Record<string, any>;
  }[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface INotificationSettings extends Document {
  _id: string;
  userId: string; // ID de usuario de PostgreSQL
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
  horarioNoMolestarDesde?: string; // HH:mm
  horarioNoMolestarHasta?: string; // HH:mm
  diasNoMolestar?: number[]; // 0-6 (domingo a sábado)
  fechaActualizacion: Date;
}

export interface INotificationTemplate extends Document {
  _id: string;
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

export interface INotificationLog extends Document {
  _id: string;
  notificationId: string;
  canal: NotificationChannel;
  estado: 'ENVIADO' | 'FALLIDO' | 'REINTENTANDO';
  mensaje?: string;
  error?: string;
  intentos: number;
  fechaCreacion: Date;
}

// Esquemas de Mongoose
const NotificationSchema = new Schema<INotification>({
  titulo: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  mensaje: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  tipo: {
    type: String,
    enum: Object.values(NotificationType),
    required: true
  },
  destinatarioId: {
    type: String,
    required: true,
    index: true
  },
  remitenteId: {
    type: String,
    index: true
  },
  estado: {
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true
  },
  prioridad: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.NORMAL,
    index: true
  },
  canales: [{
    type: String,
    enum: Object.values(NotificationChannel),
    default: [NotificationChannel.IN_APP]
  }],
  leida: {
    type: Boolean,
    default: false,
    index: true
  },
  fechaLectura: Date,
  programada: {
    type: Date,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  acciones: [{
    id: String,
    texto: String,
    tipo: {
      type: String,
      enum: ['PRIMARY', 'SECONDARY', 'DANGER']
    },
    url: String,
    metodo: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE']
    },
    data: Schema.Types.Mixed
  }]
}, {
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' }
});

const NotificationSettingsSchema = new Schema<INotificationSettings>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  configuracion: {
    type: Schema.Types.Mixed,
    required: true,
    default: () => {
      const defaultConfig: any = {};
      Object.values(NotificationType).forEach(tipo => {
        defaultConfig[tipo] = {
          habilitado: true,
          canales: [NotificationChannel.IN_APP],
          sonido: true,
          vibration: true,
          horarioDesde: '08:00',
          horarioHasta: '22:00'
        };
      });
      return defaultConfig;
    }
  },
  noMolestar: {
    type: Boolean,
    default: false
  },
  horarioNoMolestarDesde: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  horarioNoMolestarHasta: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  diasNoMolestar: [{
    type: Number,
    min: 0,
    max: 6
  }]
}, {
  timestamps: { updatedAt: 'fechaActualizacion' }
});

const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  nombre: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
    trim: true
  },
  tipo: {
    type: String,
    enum: Object.values(NotificationType),
    required: true
  },
  titulo: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  mensaje: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  variables: [{
    type: String,
    trim: true
  }],
  canales: [{
    type: String,
    enum: Object.values(NotificationChannel),
    default: [NotificationChannel.IN_APP]
  }],
  activo: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' }
});

const NotificationLogSchema = new Schema<INotificationLog>({
  notificationId: {
    type: String,
    required: true,
    index: true
  },
  canal: {
    type: String,
    enum: Object.values(NotificationChannel),
    required: true
  },
  estado: {
    type: String,
    enum: ['ENVIADO', 'FALLIDO', 'REINTENTANDO'],
    required: true,
    index: true
  },
  mensaje: {
    type: String,
    maxlength: 500
  },
  error: {
    type: String,
    maxlength: 1000
  },
  intentos: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: { createdAt: 'fechaCreacion' }
});

// Índices compuestos para mejor rendimiento
NotificationSchema.index({ destinatarioId: 1, fechaCreacion: -1 });
NotificationSchema.index({ destinatarioId: 1, leida: 1 });
NotificationSchema.index({ destinatarioId: 1, tipo: 1 });
NotificationSchema.index({ estado: 1, programada: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

NotificationTemplateSchema.index({ tipo: 1, activo: 1 });
NotificationLogSchema.index({ notificationId: 1, fechaCreacion: -1 });

// Middleware pre-save para notificaciones
NotificationSchema.pre('save', function(next) {
  // Si se marca como leída, establecer fechaLectura
  if (this.leida && !this.fechaLectura) {
    this.fechaLectura = new Date();
  }

  // Si se desmarca como leída, limpiar fechaLectura
  if (!this.leida && this.fechaLectura) {
    this.fechaLectura = undefined;
  }

  next();
});

// Métodos de instancia para notificaciones
NotificationSchema.methods.marcarComoLeida = function() {
  this.leida = true;
  this.fechaLectura = new Date();
  return this.save();
};

NotificationSchema.methods.marcarComoNoLeida = function() {
  this.leida = false;
  this.fechaLectura = undefined;
  return this.save();
};

NotificationSchema.methods.estaExpirada = function(): boolean {
  return this.expiresAt && this.expiresAt < new Date();
};

NotificationSchema.methods.debeEnviarse = function(): boolean {
  const ahora = new Date();

  // Si está programada para el futuro
  if (this.programada && this.programada > ahora) {
    return false;
  }

  // Si está expirada
  if (this.estaExpirada()) {
    return false;
  }

  // Si ya fue enviada
  if (this.estado === NotificationStatus.SENT) {
    return false;
  }

  return true;
};

// Métodos estáticos
NotificationSchema.statics.findByUser = function(userId: string, filters: any = {}) {
  return this.find({ destinatarioId: userId, ...filters })
    .sort({ fechaCreacion: -1 });
};

NotificationSchema.statics.findUnreadByUser = function(userId: string) {
  return this.find({ destinatarioId: userId, leida: false })
    .sort({ fechaCreacion: -1 });
};

NotificationSchema.statics.countUnreadByUser = function(userId: string) {
  return this.countDocuments({ destinatarioId: userId, leida: false });
};

NotificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany(
    { destinatarioId: userId, leida: false },
    { leida: true, fechaLectura: new Date() }
  );
};

NotificationSchema.statics.deleteExpired = function() {
  const ahora = new Date();
  return this.deleteMany({
    expiresAt: { $lt: ahora }
  });
};

NotificationSchema.statics.findPendingScheduled = function() {
  const ahora = new Date();
  return this.find({
    estado: NotificationStatus.PENDING,
    programada: { $lte: ahora }
  });
};


// Métodos para configuración de notificaciones
NotificationSettingsSchema.statics.findOrCreateByUser = async function(userId: string) {
  let settings = await this.findOne({ userId });

  if (!settings) {
    settings = new this({ userId });
    await settings.save();
  }

  return settings;
};

NotificationSettingsSchema.methods.puedeRecibir = function(
  tipo: NotificationType,
  canal: NotificationChannel,
  hora?: Date
): boolean {
  const config = this.configuracion[tipo];

  if (!config || !config.habilitado) {
    return false;
  }

  if (!config.canales.includes(canal)) {
    return false;
  }

  // Verificar modo no molestar
  if (this.noMolestar) {
    if (hora && this.horarioNoMolestarDesde && this.horarioNoMolestarHasta) {
      const horaActual = hora.getHours() * 100 + hora.getMinutes();
      const desde = parseInt(this.horarioNoMolestarDesde.replace(':', ''));
      const hasta = parseInt(this.horarioNoMolestarHasta.replace(':', ''));

      if (horaActual >= desde && horaActual <= hasta) {
        return false;
      }
    }

    // Verificar días de no molestar
    if (hora && this.diasNoMolestar && this.diasNoMolestar.length > 0) {
      const diaActual = hora.getDay();
      if (this.diasNoMolestar.includes(diaActual)) {
        return false;
      }
    }
  }

  // Verificar horario permitido para el tipo de notificación
  if (hora && config.horarioDesde && config.horarioHasta) {
    const horaActual = hora.getHours() * 100 + hora.getMinutes();
    const desde = parseInt(config.horarioDesde.replace(':', ''));
    const hasta = parseInt(config.horarioHasta.replace(':', ''));

    if (horaActual < desde || horaActual > hasta) {
      return false;
    }
  }

  return true;
};

// Exportar modelos
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const NotificationSettings = mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);
export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);
export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);