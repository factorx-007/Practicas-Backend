// Enums para el módulo social (basados en el schema actual)
export enum TipoReaccion {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY'
}

// Interfaces base para entidades (basadas en el schema actual)
export interface Post {
  id: string;
  contenido: string;
  autorId: string;
  imagenes: string[];
  videos: string[];
  privado: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones opcionales
  autor?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    avatar?: string;
    rol: string;
  };
  comentarios?: Comentario[];
  reacciones?: Reaccion[];
}

export interface Comentario {
  id: string;
  postId: string;
  autorId: string;
  contenido: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones opcionales
  autor?: {
    id: string;
    nombre: string;
    apellido: string;
    avatar?: string;
    rol: string;
  };
  respuestas?: Comentario[];
  reacciones?: Reaccion[];
}

export interface Reaccion {
  id: string;
  tipo: TipoReaccion;
  usuarioId: string;
  postId?: string;
  comentarioId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones opcionales
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    avatar?: string;
  };
}

// DTOs para crear/actualizar entidades
export interface CreatePostDTO {
  contenido: string;
  imagenes?: string[];
  videos?: string[];
  privado?: boolean;
}

export interface UpdatePostDTO {
  contenido?: string;
  privado?: boolean;
}

export interface CreateComentarioDTO {
  contenido: string;
  postId: string;
  parentId?: string;
}

export interface UpdateComentarioDTO {
  contenido: string;
}

export interface CreateReaccionDTO {
  tipo: TipoReaccion;
  postId?: string;
  comentarioId?: string;
}

// Parámetros de consulta
export interface PostQueryParams {
  page?: number;
  limit?: number;
  autorId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
  soloConexiones?: boolean;
  incluirComentarios?: boolean;
  incluirReacciones?: boolean;
  orderBy?: 'createdAt';
  order?: 'asc' | 'desc';
}

export interface ComentarioQueryParams {
  page?: number;
  limit?: number;
  postId: string;
  incluirRespuestas?: boolean;
  incluirReacciones?: boolean;
  orderBy?: 'createdAt';
  order?: 'asc' | 'desc';
}

// Respuestas paginadas
export interface PostsResponse {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ComentariosResponse {
  comentarios: Comentario[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}