import { UserRole } from './common.types';

export enum ModalidadTrabajo {
  TIEMPO_COMPLETO = 'TIEMPO_COMPLETO',
  MEDIO_TIEMPO = 'MEDIO_TIEMPO',
  PRACTICA = 'PRACTICA',
  FREELANCE = 'FREELANCE',
  REMOTO = 'REMOTO',
  HIBRIDO = 'HIBRIDO',
  PRESENCIAL = 'PRESENCIAL'
}

export enum EstadoOferta {
  ACTIVA = 'ACTIVA',
  CERRADA = 'CERRADA',
  BORRADOR = 'BORRADOR'
}

export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  rol?: UserRole;
  activo?: boolean;
  verificado?: boolean;
  perfilCompleto?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  orderBy?: 'createdAt' | 'updatedAt' | 'nombre' | 'email';
  order?: 'asc' | 'desc';
}

export interface AdminUserStats {
  total: number;
  porRol: {
    ESTUDIANTE: number;
    EMPRESA: number;
    INSTITUCION: number;
    ADMIN: number;
  };
  activos: number;
  inactivos: number;
  verificados: number;
  noVerificados: number;
  perfilCompleto: number;
  perfilIncompleto: number;
  registrosHoy: number;
  registrosEstaSemana: number;
  registrosEsteMes: number;
}

export interface AdminUpdateUserDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: UserRole;
  activo?: boolean;
  emailVerificado?: boolean;
}

export interface AdminOfferQuery {
  page?: number;
  limit?: number;
  search?: string;
  modalidad?: ModalidadTrabajo;
  estado?: EstadoOferta;
  empresaId?: string;
  verificada?: boolean;
  destacada?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  orderBy?: 'createdAt' | 'updatedAt' | 'vistas';
  order?: 'asc' | 'desc';
}

export interface AdminOfferStats {
  total: number;
  activas: number;
  cerradas: number;
  borradores: number;
  verificadas: number;
  noVerificadas: number;
  destacadas: number;
  porModalidad: Record<ModalidadTrabajo, number>;
  publicadasHoy: number;
  publicadasEstaSemana: number;
  publicadasEsteMes: number;
  totalPostulaciones: number;
  promedioPostulacionesPorOferta: number;
}

export interface AdminOfferUpdateDTO {
  verificada?: boolean;
  destacada?: boolean;
  estado?: EstadoOferta;
  razonRechazo?: string;
}

export interface AdminPostQuery {
  page?: number;
  limit?: number;
  search?: string;
  autorId?: string;
  reportado?: boolean;
  oculto?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  orderBy?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface AdminPostStats {
  total: number;
  publicados: number;
  ocultos: number;
  reportados: number;
  conMedia: number;
  totalReacciones: number;
  totalComentarios: number;
  postsHoy: number;
  postsEstaSemana: number;
  postsEsteMes: number;
}

export interface AdminPostUpdateDTO {
  oculto?: boolean;
  razonOcultar?: string;
}

export interface AdminReportQuery {
  page?: number;
  limit?: number;
  tipo?: 'POST' | 'COMENTARIO' | 'USUARIO' | 'OFERTA' | 'MENSAJE';
  estado?: 'PENDIENTE' | 'EN_REVISION' | 'RESUELTO' | 'RECHAZADO';
  prioridad?: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  reportadoPor?: string;
  reportado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface AdminReportStats {
  total: number;
  pendientes: number;
  enRevision: number;
  resueltos: number;
  rechazados: number;
  porTipo: {
    POST: number;
    COMENTARIO: number;
    USUARIO: number;
    OFERTA: number;
    MENSAJE: number;
  };
  porPrioridad: {
    BAJA: number;
    MEDIA: number;
    ALTA: number;
    URGENTE: number;
  };
  reportesHoy: number;
  reportesEstaSemana: number;
  reportesEsteMes: number;
}

export interface AdminDashboardStats {
  usuarios: {
    total: number;
    nuevosHoy: number;
    nuevosEstaSemana: number;
    activos: number;
  };
  ofertas: {
    total: number;
    activas: number;
    nuevasHoy: number;
    totalPostulaciones: number;
  };
  contenido: {
    totalPosts: number;
    nuevosPostsHoy: number;
    totalReacciones: number;
    totalComentarios: number;
  };
  reportes: {
    pendientes: number;
    urgentes: number;
    totalResueltos: number;
  };
  actividad: {
    usuariosActivos24h: number;
    usuariosActivos7d: number;
    tasaRetencion: number;
  };
}

export interface AdminActionLog {
  id: string;
  adminId: string;
  adminEmail: string;
  accion: string;
  tipoRecurso: 'USUARIO' | 'OFERTA' | 'POST' | 'COMENTARIO' | 'REPORTE';
  recursoId: string;
  detalles?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  fecha: Date;
}