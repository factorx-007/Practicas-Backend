import {
  UserRole,
  StudentType,
  BaseFilter,
  DisponibilidadTipo,
  ModalidadTrabajo,
  TipoInstitucion,
  NivelAcademico,
  SistemaNotas,
  NivelDominio,
  TipoProyecto,
  EstadoProyecto,
  ContextoProyecto,
  TipoCertificacion,
  NivelIdioma,
} from './common.types';
import { Prisma, TamanioEmpresa, TipoEmpresa } from '@prisma/client';

// ===================================================
// TIPOS DE PERFILES BASE
// ===================================================

export interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  avatar?: string | null;
  rol: UserRole;
  activo: boolean;
  emailVerificado: boolean;
  perfilCompleto: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===================================================
// TIPOS DETALLADOS PARA PERFIL DE ESTUDIANTE
// ===================================================

export interface PerfilProfesional {
  id: string;
  resumen: string;
  objetivo_carrera?: string | null;
  disponibilidad: DisponibilidadTipo;
  modalidad_trabajo: ModalidadTrabajo[];
  salario_minimo?: Prisma.Decimal | null;
  salario_maximo?: Prisma.Decimal | null;
  moneda: string;
}

export interface ExperienciaLaboral {
  id: string;
  cargo: string;
  empresa: string;
  fecha_inicio: Date;
  fecha_fin?: Date | null;
  es_actual: boolean;
  modalidad: ModalidadTrabajo;
  descripcion?: string | null;
  responsabilidades: string[];
  logros: string[];
  tecnologias?: { tecnologia: { nombre: string; categoria: string } }[];
}

export interface EducacionAcademica {
  id: string;
  institucion: string;
  tipo_institucion: TipoInstitucion;
  titulo: string;
  campo_estudio?: string | null;
  nivel_academico: NivelAcademico;
  fecha_inicio: Date;
  fecha_fin?: Date | null;
  en_curso: boolean;
  promedio?: Prisma.Decimal | null;
  sistema_notas: SistemaNotas;
  cursos_destacados: Prisma.JsonValue[];
}

export interface EstudianteHabilidad {
  id: string;
  nivel: NivelDominio;
  anios_experiencia?: number | null;
  habilidad: {
    nombre: string;
    categoria: string;
    tipo: string;
  };
}

export interface Proyecto {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoProyecto;
  fecha_inicio: Date;
  fecha_fin?: Date | null;
  estado: EstadoProyecto;
  url_repositorio?: string | null;
  url_demo?: string | null;
  contexto?: ContextoProyecto | null;
  imagenes: string[];
  tecnologias?: { tecnologia: { nombre: string; categoria: string } }[];
}

export interface Certificacion {
  id: string;
  titulo: string;
  emisor: string;
  tipo: TipoCertificacion;
  fecha_emision: Date;
  fecha_expiracion?: Date | null;
  credencial_id?: string | null;
  url_verificacion?: string | null;
  habilidades?: { habilidad: { nombre: string } }[];
}

export interface EstudianteIdioma {
  id: string;
  nivel_oral: NivelIdioma;
  nivel_escrito: NivelIdioma;
  nivel_lectura: NivelIdioma;
  idioma: {
    nombre: string;
    codigo_iso: string;
  };
}

// ===================================================
// TIPO PRINCIPAL PARA PERFIL DE ESTUDIANTE
// ===================================================

export interface StudentProfile {
  id: string;
  usuarioId: string;
  cv?: string | null;
  carrera: string;
  universidad?: string | null;
  anio_ingreso?: number | null;
  anio_egreso?: number | null;
  telefono?: string | null;
  portafolio?: string | null;
  linkedin?: string | null;
  github?: string | null;
  ubicacion?: string | null;
  tipo: StudentType;
  usuario: UserProfile;

  // --- NUEVAS RELACIONES ---
  perfilProfesional: PerfilProfesional | null;
  experiencias: ExperienciaLaboral[];
  educacion: EducacionAcademica[];
  habilidadesNuevas: EstudianteHabilidad[];
  proyectos: Proyecto[];
  certificaciones: Certificacion[];
  idiomas: EstudianteIdioma[];
}

// ===================================================
// TIPOS PARA PERFIL DE EMPRESA E INSTITUCIÓN
// ===================================================

export interface CompanyProfile {
  id: string;
  usuarioId: string;
  ruc: string;
  nombre_empresa: string;
  rubro: string;
  descripcion?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  website?: string | null;
  logo_url?: string | null;
  verificada: boolean;
  usuario: UserProfile;
  perfilEmpresa?: PerfilEmpresa | null;
}

export interface PerfilEmpresa {
  id: string;
  sector_id?: string | null;
  tamanio: TamanioEmpresa;
  anio_fundacion?: number | null;
  tipo: TipoEmpresa;
  cultura_descripcion?: string | null;
  mision?: string | null;
  vision?: string | null;
  linkedin_url?: string | null;
  valores: Prisma.JsonValue[];
  galeria: string[];
}

export { TamanioEmpresa, TipoEmpresa } from '@prisma/client';

export interface InstitutionProfile {
  id: string;
  usuarioId: string;
  nombre: string;
  tipo: string;
  codigo: string;
  direccion?: string | null;
  telefono?: string | null;
  website?: string | null;
  logo_url?: string | null;
  usuario: UserProfile;
}

// ===================================================
// TIPOS PARA ACTUALIZACIÓN DE PERFILES
// ===================================================

export interface UpdateUserRequest {
  nombre?: string;
  apellido?: string;
  avatar?: string;
}

// Tipo para la data que llega al endpoint de actualización
export type UpdateStudentProfileRequest = {
  // Campos del modelo Estudiante
  carrera?: string;
  universidad?: string;
  anio_ingreso?: number;
  anio_egreso?: number;
  telefono?: string;
  portafolio?: string;
  linkedin?: string;
  github?: string;
  ubicacion?: string;
  tipo?: StudentType;

  // Campos de PerfilProfesional (anidados)
  perfilProfesional?: {
    upsert: {
      create: Omit<Prisma.PerfilProfesionalCreateInput, 'estudiante'>;
      update: Partial<Omit<Prisma.PerfilProfesionalUpdateInput, 'estudiante'>>;
    };
  };

  // Campos de ExperienciaLaboral (manejo de array anidado)
  experiencias?: {
    create?: Omit<Prisma.ExperienciaLaboralCreateInput, 'estudiante'>[];
    update?: { where: { id: string }; data: Partial<Omit<Prisma.ExperienciaLaboralUpdateInput, 'estudiante'>> }[];
    delete?: { id: string }[];
  };
  
  educacion?: {
    create?: Omit<Prisma.EducacionAcademicaCreateInput, 'estudiante'>[];
    update?: { where: { id: string }; data: Partial<Omit<Prisma.EducacionAcademicaUpdateInput, 'estudiante'>> }[];
    delete?: { id: string }[];
  };

  proyectos?: {
    create?: Omit<Prisma.ProyectoCreateInput, 'estudiante'>[];
    update?: { where: { id: string }; data: Partial<Omit<Prisma.ProyectoUpdateInput, 'estudiante'>> }[];
    delete?: { id: string }[];
  };

  certificaciones?: {
    create?: Omit<Prisma.CertificacionCreateInput, 'estudiante'>[];
    update?: { where: { id: string }; data: Partial<Omit<Prisma.CertificacionUpdateInput, 'estudiante'>> }[];
    delete?: { id: string }[];
  };

  idiomas?: {
    create?: Omit<Prisma.EstudianteIdiomaCreateInput, 'estudiante'>[];
    update?: { where: { id: string }; data: Partial<Omit<Prisma.EstudianteIdiomaUpdateInput, 'estudiante'>> }[];
    delete?: { id: string }[];
  };

  habilidadesNuevas?: {
    create?: {
      nivel?: string;
      anios_experiencia?: number;
      habilidadId?: string; // Para conectar con habilidad existente
      habilidad?: {
        nombre: string;
        categoria?: string;
        tipo?: string;
      }; // Para crear nueva habilidad
    }[];
    update?: { where: { id: string }; data: Partial<Omit<Prisma.EstudianteHabilidadUpdateInput, 'estudiante'>> }[];
    delete?: { id: string }[];
  };
};



export interface UpdateCompanyRequest {
  nombre_empresa?: string;
  rubro?: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  website?: string;
  logo_url?: string;

  perfilEmpresa?: {
    upsert: {
      create: Omit<Prisma.PerfilEmpresaCreateInput, 'empresa'>;
      update: Partial<Omit<Prisma.PerfilEmpresaUpdateInput, 'empresa'>>;
    };
  };
}

export interface UpdateInstitutionRequest {
  nombre?: string;
  tipo?: string;
  direccion?: string;
  telefono?: string;
  website?: string;
  logo_url?: string;
}

// Tipos para seguimiento
export interface FollowRequest {
  seguidoId: string;
}

export interface FollowInfo {
  id: string;
  seguidorId: string;
  seguidoId: string;
  createdAt: Date;
  seguido: UserProfile;
  seguidor: UserProfile;
}

// Tipos para búsqueda y filtros
export interface UserSearchFilter extends BaseFilter {
  rol?: UserRole;
  verificado?: boolean;
  activo?: boolean;
}

export interface StudentSearchFilter extends BaseFilter {
  tipo?: StudentType;
  carrera?: string;
  universidad?: string;
  habilidades?: string[];
  ubicacion?: string;
}

export interface CompanySearchFilter extends BaseFilter {
  rubro?: string;
  verificada?: boolean;
  ubicacion?: string;
}

// Tipos para estadísticas
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: {
    [key in UserRole]: number;
  };
  verifiedUsers: number;
  newUsersThisMonth: number;
}

export interface StudentStats {
  totalStudents: number;
  studentsByType: {
    [key in StudentType]: number;
  };
  topUniversities: Array<{
    universidad: string;
    count: number;
  }>;
  topSkills: Array<{
    habilidad: string;
    count: number;
  }>;
}

export interface CompanyStats {
  totalCompanies: number;
  verifiedCompanies: number;
  topIndustries: Array<{
    rubro: string;
    count: number;
  }>;
}