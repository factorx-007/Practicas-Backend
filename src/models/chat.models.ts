import mongoose, { Document, Schema } from 'mongoose';

// Enums para el chat
export enum TipoConversacion {
  PRIVADA = 'PRIVADA',
  GRUPO = 'GRUPO'
}

export enum TipoMensaje {
  TEXTO = 'TEXTO',
  IMAGEN = 'IMAGEN',
  VIDEO = 'VIDEO',
  ARCHIVO = 'ARCHIVO',
  SISTEMA = 'SISTEMA'
}

export enum EstadoMensaje {
  ENVIADO = 'ENVIADO',
  ENTREGADO = 'ENTREGADO',
  LEIDO = 'LEIDO'
}

// Interfaces para TypeScript
export interface IConversacion extends Document {
  _id: string;
  tipo: TipoConversacion;
  nombre?: string;
  descripcion?: string;
  participantes: string[]; // IDs de usuarios de PostgreSQL
  creadorId: string;
  ultimoMensaje?: {
    contenido: string;
    fecha: Date;
    autorId: string;
  };
  configuracion: {
    notificacionesHabilitadas: boolean;
    soloAdminsEnvianMensajes: boolean;
  };
  admins: string[]; // Solo para grupos
  activa: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface IMensaje extends Document {
  _id: string;
  conversacionId: string;
  autorId: string; // ID de usuario de PostgreSQL
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
  mensajeReferencia?: string; // Para respuestas
  reacciones: {
    userId: string;
    emoji: string;
    fecha: Date;
  }[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface IEstadoLectura extends Document {
  _id: string;
  conversacionId: string;
  userId: string;
  ultimoMensajeLeido: string;
  fechaUltimaLectura: Date;
}

// Esquemas de Mongoose
const ConversacionSchema = new Schema<IConversacion>({
  tipo: {
    type: String,
    enum: Object.values(TipoConversacion),
    required: true,
    default: TipoConversacion.PRIVADA
  },
  nombre: {
    type: String,
    maxlength: 100,
    trim: true
  },
  descripcion: {
    type: String,
    maxlength: 500,
    trim: true
  },
  participantes: [{
    type: String,
    required: true
  }],
  creadorId: {
    type: String,
    required: true
  },
  ultimoMensaje: {
    contenido: String,
    fecha: Date,
    autorId: String
  },
  configuracion: {
    notificacionesHabilitadas: {
      type: Boolean,
      default: true
    },
    soloAdminsEnvianMensajes: {
      type: Boolean,
      default: false
    }
  },
  admins: [{
    type: String
  }],
  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' }
});

const MensajeSchema = new Schema<IMensaje>({
  conversacionId: {
    type: String,
    required: true,
    index: true
  },
  autorId: {
    type: String,
    required: true
  },
  contenido: {
    type: String,
    required: true,
    maxlength: 2000
  },
  tipo: {
    type: String,
    enum: Object.values(TipoMensaje),
    required: true,
    default: TipoMensaje.TEXTO
  },
  archivosAdjuntos: [{
    nombre: String,
    url: String,
    tipo: String,
    tamaño: Number
  }],
  estado: {
    type: String,
    enum: Object.values(EstadoMensaje),
    default: EstadoMensaje.ENVIADO
  },
  editado: {
    type: Boolean,
    default: false
  },
  fechaEdicion: Date,
  mensajeReferencia: {
    type: String,
    ref: 'Mensaje'
  },
  reacciones: [{
    userId: String,
    emoji: String,
    fecha: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' }
});

const EstadoLecturaSchema = new Schema<IEstadoLectura>({
  conversacionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  ultimoMensajeLeido: {
    type: String,
    required: true
  },
  fechaUltimaLectura: {
    type: Date,
    default: Date.now
  }
});

// Índices compuestos para mejor rendimiento
ConversacionSchema.index({ participantes: 1, activa: 1 });
ConversacionSchema.index({ 'ultimoMensaje.fecha': -1 });

MensajeSchema.index({ conversacionId: 1, fechaCreacion: -1 });
MensajeSchema.index({ autorId: 1, fechaCreacion: -1 });

EstadoLecturaSchema.index({ conversacionId: 1, userId: 1 }, { unique: true });

// Middleware pre-save para conversaciones
ConversacionSchema.pre('save', function(next) {
  // Asegurar que el creador esté en participantes
  if (!this.participantes.includes(this.creadorId)) {
    this.participantes.push(this.creadorId);
  }

  // Para grupos, asegurar que el creador sea admin
  if (this.tipo === TipoConversacion.GRUPO && !this.admins.includes(this.creadorId)) {
    this.admins.push(this.creadorId);
  }

  next();
});

// Métodos de instancia
ConversacionSchema.methods.agregarParticipante = function(userId: string) {
  if (!this.participantes.includes(userId)) {
    this.participantes.push(userId);
    return this.save();
  }
};

ConversacionSchema.methods.removerParticipante = function(userId: string) {
  this.participantes = this.participantes.filter((id: string) => id !== userId);
  // Si era admin, también removerlo de admins
  this.admins = this.admins.filter((id: string) => id !== userId);
  return this.save();
};

ConversacionSchema.methods.esAdmin = function(userId: string): boolean {
  return this.admins.includes(userId);
};

ConversacionSchema.methods.esParticipante = function(userId: string): boolean {
  return this.participantes.includes(userId);
};

// Exportar modelos
export const Conversacion = mongoose.model<IConversacion>('Conversacion', ConversacionSchema);
export const Mensaje = mongoose.model<IMensaje>('Mensaje', MensajeSchema);
export const EstadoLectura = mongoose.model<IEstadoLectura>('EstadoLectura', EstadoLecturaSchema);