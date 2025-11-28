import { Oferta, Postulacion, PreguntaOferta, RespuestaPostulacion } from '@prisma/client';

// Tipos para crear ofertas
export interface CreateOfferData {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  modalidad: string;
  tipoEmpleo: string;
  nivelEducacion: string;
  experiencia: string;
  salarioMin?: number;
  salarioMax?: number;
  fechaLimite: Date;
  preguntas?: CreateQuestionData[];
}

export interface CreateQuestionData {
  pregunta: string;
  tipo: string;
  obligatoria: boolean;
  opciones?: string[];
}

// Tipos para actualizar ofertas
export interface UpdateOfferData {
  titulo?: string;
  descripcion?: string;
  ubicacion?: string;
  modalidad?: string;
  tipoEmpleo?: string;
  nivelEducacion?: string;
  experiencia?: string;
  salarioMin?: number;
  salarioMax?: number;
  fechaLimite?: Date;
  activo?: boolean;
}

// Tipos para postulaciones
export interface CreateApplicationData {
  estudianteId: string;
  respuestas?: CreateAnswerData[];
}

export interface CreateAnswerData {
  preguntaId: string;
  respuesta: string;
}

export interface UpdateApplicationStatusData {
  estado: string;
  notasEntrevistador?: string;
}

// Tipos extendidos con relaciones
export interface OfferWithDetails extends Oferta {
  empresa: {
    id: string;
    nombre: string;
    logo?: string;
  };
  preguntas: PreguntaOferta[];
  _count: {
    postulaciones: number;
  };
}

export interface ApplicationWithDetails extends Postulacion {
  estudiante: {
    id: string;
    usuario: {
      nombre: string;
      apellido: string;
      email: string;
      avatar?: string;
    };
    carrera?: string;
    universidad?: string;
    cv_url?: string;
  };
  oferta: {
    id: string;
    titulo: string;
    empresa: {
      nombre: string;
    };
  };
  respuestas: (RespuestaPostulacion & {
    pregunta: PreguntaOferta;
  })[];
}

// Tipos para estadísticas
export interface OfferStatistics {
  totalPostulaciones: number;
  postulacionesPorEstado: {
    [key: string]: number;
  };
  postulacionesPorDia: {
    fecha: string;
    total: number;
  }[];
}

export interface ApplicationStatistics {
  totalPostulaciones: number;
  postulacionesAceptadas: number;
  postulacionesRechazadas: number;
  postulacionesPendientes: number;
  tasaExito: number;
}