-- CreateEnum
CREATE TYPE "public"."Rol" AS ENUM ('estudiante', 'empresa', 'institucion', 'admin');

-- CreateEnum
CREATE TYPE "public"."TipoEstudiante" AS ENUM ('estudiante', 'egresado');

-- CreateEnum
CREATE TYPE "public"."EstadoPostulacion" AS ENUM ('pendiente', 'en_revision', 'aceptada', 'rechazada', 'entrevista');

-- CreateEnum
CREATE TYPE "public"."TipoPregunta" AS ENUM ('text', 'number', 'select', 'textarea', 'email', 'url');

-- CreateEnum
CREATE TYPE "public"."TipoReaccion" AS ENUM ('like', 'love', 'haha', 'wow', 'sad', 'angry');

-- CreateEnum
CREATE TYPE "public"."EstadoOferta" AS ENUM ('publicada', 'cerrada', 'borrador', 'pausada');

-- CreateEnum
CREATE TYPE "public"."ModalidadTrabajo" AS ENUM ('tiempo_completo', 'medio_tiempo', 'practica', 'freelance', 'remoto', 'hibrido', 'presencial');

-- CreateEnum
CREATE TYPE "public"."TipoNotificacion" AS ENUM ('nueva_oferta', 'postulacion', 'mensaje', 'reaccion', 'comentario', 'seguimiento', 'actualizacion_perfil', 'sistema');

-- CreateEnum
CREATE TYPE "public"."DisponibilidadTipo" AS ENUM ('INMEDIATA', 'DOS_SEMANAS', 'UN_MES', 'NEGOCIABLE');

-- CreateEnum
CREATE TYPE "public"."TipoInstitucion" AS ENUM ('INSTITUTO', 'UNIVERSIDAD', 'CENTRO_TECNICO', 'ESCUELA_PROFESIONAL');

-- CreateEnum
CREATE TYPE "public"."NivelAcademico" AS ENUM ('BACHILLERATO', 'TECNICO', 'PREGRADO', 'EGRESADO', 'BACHILLER', 'TITULADO', 'POSTGRADO', 'MAESTRIA', 'DOCTORADO');

-- CreateEnum
CREATE TYPE "public"."SistemaNotas" AS ENUM ('VIGESIMAL', 'ALFABETICO', 'NUMERICO_100', 'GPA');

-- CreateEnum
CREATE TYPE "public"."NivelDominio" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO');

-- CreateEnum
CREATE TYPE "public"."TipoProyecto" AS ENUM ('DESARROLLO_SOFTWARE', 'DISEÑO', 'INGENIERIA', 'INVESTIGACION', 'CONSTRUCCION', 'TOPOGRAFIA', 'AUTOMATIZACION', 'OTRO');

-- CreateEnum
CREATE TYPE "public"."EstadoProyecto" AS ENUM ('COMPLETADO', 'EN_DESARROLLO', 'PAUSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."ContextoProyecto" AS ENUM ('ACADEMICO', 'PERSONAL', 'FREELANCE', 'EMPRESA', 'COMPETENCIA');

-- CreateEnum
CREATE TYPE "public"."TipoCertificacion" AS ENUM ('PROFESIONAL', 'CURSO_ONLINE', 'CERTIFICADO_ACADEMICO', 'LICENCIA', 'CAPACITACION');

-- CreateEnum
CREATE TYPE "public"."NivelIdioma" AS ENUM ('A1_BASICO', 'A2_ELEMENTAL', 'B1_INTERMEDIO', 'B2_INTERMEDIO_ALTO', 'C1_AVANZADO', 'C2_MAESTRIA', 'NATIVO');

-- CreateEnum
CREATE TYPE "public"."TipoDocumento" AS ENUM ('CV', 'CARTA_PRESENTACION', 'CERTIFICADO', 'PORTAFOLIO', 'TRANSCRIPT', 'CARTA_RECOMENDACION', 'OTRO');

-- CreateEnum
CREATE TYPE "public"."TipoReconocimiento" AS ENUM ('BECA', 'PREMIO', 'MENCION_HONROSA', 'PUBLICACION', 'PATENTE', 'COMPETENCIA', 'LIDERAZGO', 'VOLUNTARIADO');

-- CreateEnum
CREATE TYPE "public"."TamanioEmpresa" AS ENUM ('MICRO', 'PEQUEÑA', 'MEDIANA', 'GRANDE', 'CORPORACION');

-- CreateEnum
CREATE TYPE "public"."TipoEmpresa" AS ENUM ('STARTUP', 'PYME', 'CORPORACION', 'MULTINACIONAL', 'ONG', 'GOBIERNO', 'CONSULTORA');

-- CreateEnum
CREATE TYPE "public"."TipoRelacion" AS ENUM ('SUPERVISOR', 'PROFESOR', 'CLIENTE', 'COLEGA', 'MENTOR');

-- CreateEnum
CREATE TYPE "public"."EstadoReferencia" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "public"."CategoriaHabilidad" AS ENUM ('LENGUAJE_PROGRAMACION', 'FRAMEWORK_LIBRERIA', 'HERRAMIENTA_SOFTWARE', 'BASE_DATOS', 'CLOUD_DEVOPS', 'DISEÑO_GRAFICO', 'DISEÑO_3D', 'INGENIERIA_CIVIL', 'TOPOGRAFIA', 'AUTOMATIZACION', 'GESTION_PROYECTOS', 'SOFT_SKILL', 'IDIOMA_TECNICO', 'OTRO');

-- CreateEnum
CREATE TYPE "public"."TipoHabilidad" AS ENUM ('TECNICA', 'BLANDA');

-- CreateEnum
CREATE TYPE "public"."CategoriaTecnologia" AS ENUM ('FRONTEND', 'BACKEND', 'MOBILE', 'BASE_DATOS', 'CLOUD', 'DISEÑO', 'CAD_BIM', 'TOPOGRAFIA', 'GESTION', 'OTRO');

-- CreateEnum
CREATE TYPE "public"."CategoriaBeneficio" AS ENUM ('SALUD', 'FINANCIERO', 'DESARROLLO_PROFESIONAL', 'FLEXIBILIDAD', 'BIENESTAR', 'TRANSPORTE', 'ALIMENTACION', 'OTRO');

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "avatar" TEXT,
    "rol" "public"."Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "perfilCompleto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."estudiantes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cv" TEXT,
    "carrera" TEXT NOT NULL,
    "universidad" TEXT,
    "anio_ingreso" INTEGER,
    "anio_egreso" INTEGER,
    "telefono" TEXT,
    "habilidades" TEXT[],
    "experiencia" JSONB,
    "portafolio" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "ubicacion" TEXT,
    "tipo" "public"."TipoEstudiante" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."empresas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "nombre_empresa" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
    "descripcion" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "verificada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instituciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instituciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ofertas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "requisitos" TEXT[],
    "duracion" TEXT,
    "estado" "public"."EstadoOferta" NOT NULL DEFAULT 'publicada',
    "ubicacion" TEXT,
    "modalidad" "public"."ModalidadTrabajo" NOT NULL DEFAULT 'tiempo_completo',
    "salario_min" DOUBLE PRECISION,
    "salario_max" DOUBLE PRECISION,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "requiereCV" BOOLEAN NOT NULL DEFAULT true,
    "requiereCarta" BOOLEAN NOT NULL DEFAULT false,
    "fecha_limite" TIMESTAMP(3),
    "empresaId" TEXT NOT NULL,
    "vistas" INTEGER NOT NULL DEFAULT 0,
    "verificada" BOOLEAN NOT NULL DEFAULT false,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."postulaciones" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT,
    "estado" "public"."EstadoPostulacion" NOT NULL DEFAULT 'pendiente',
    "estudianteId" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "fechaEntrevista" TIMESTAMP(3),
    "cv_url" TEXT,
    "comentarioEmpresa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."preguntas_ofertas" (
    "id" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "tipo" "public"."TipoPregunta" NOT NULL DEFAULT 'text',
    "opciones" JSONB,
    "requerida" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preguntas_ofertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."respuestas_postulaciones" (
    "id" TEXT NOT NULL,
    "postulacionId" TEXT NOT NULL,
    "preguntaOfertaId" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "respuestas_postulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "imagenes" TEXT[],
    "videos" TEXT[],
    "privado" BOOLEAN NOT NULL DEFAULT false,
    "oculto" BOOLEAN NOT NULL DEFAULT false,
    "reportado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comentarios" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reacciones" (
    "id" TEXT NOT NULL,
    "tipo" "public"."TipoReaccion" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "postId" TEXT,
    "comentarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follows" (
    "id" TEXT NOT NULL,
    "seguidorId" TEXT NOT NULL,
    "seguidoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chats" (
    "id" TEXT NOT NULL,
    "emisorId" TEXT NOT NULL,
    "receptorId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "public"."TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerfilProfesional" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "objetivo_carrera" TEXT,
    "disponibilidad" "public"."DisponibilidadTipo" NOT NULL DEFAULT 'INMEDIATA',
    "modalidad_trabajo" "public"."ModalidadTrabajo"[],
    "salario_minimo" DECIMAL(10,2),
    "salario_maximo" DECIMAL(10,2),
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilProfesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExperienciaLaboral" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "sector_id" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "es_actual" BOOLEAN NOT NULL DEFAULT false,
    "ubicacion_id" TEXT,
    "modalidad" "public"."ModalidadTrabajo" NOT NULL,
    "descripcion" TEXT,
    "responsabilidades" TEXT[],
    "logros" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienciaLaboral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExperienciaTecnologia" (
    "id" TEXT NOT NULL,
    "experiencia_id" TEXT NOT NULL,
    "tecnologia_id" TEXT NOT NULL,

    CONSTRAINT "ExperienciaTecnologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EducacionAcademica" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "institucion" TEXT NOT NULL,
    "tipo_institucion" "public"."TipoInstitucion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "carrera_id" TEXT,
    "campo_estudio" TEXT,
    "nivel_academico" "public"."NivelAcademico" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "en_curso" BOOLEAN NOT NULL DEFAULT false,
    "promedio" DECIMAL(4,2),
    "sistema_notas" "public"."SistemaNotas" NOT NULL DEFAULT 'VIGESIMAL',
    "ubicacion_id" TEXT,
    "mencion" TEXT,
    "tesis" TEXT,
    "cursos_destacados" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducacionAcademica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstudianteHabilidad" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "habilidad_id" TEXT NOT NULL,
    "nivel" "public"."NivelDominio" NOT NULL,
    "anios_experiencia" INTEGER,
    "certificado" BOOLEAN NOT NULL DEFAULT false,
    "es_destacada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstudianteHabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proyecto" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "public"."TipoProyecto" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "estado" "public"."EstadoProyecto" NOT NULL,
    "url_repositorio" TEXT,
    "url_demo" TEXT,
    "url_documentacion" TEXT,
    "contexto" "public"."ContextoProyecto",
    "resultado" TEXT,
    "imagen_principal" TEXT,
    "imagenes" TEXT[],
    "colaboradores" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProyectoTecnologia" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "tecnologia_id" TEXT NOT NULL,
    "rol" TEXT,

    CONSTRAINT "ProyectoTecnologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Certificacion" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "emisor" TEXT NOT NULL,
    "tipo" "public"."TipoCertificacion" NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_expiracion" TIMESTAMP(3),
    "credencial_id" TEXT,
    "url_verificacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CertificacionHabilidad" (
    "id" TEXT NOT NULL,
    "certificacion_id" TEXT NOT NULL,
    "habilidad_id" TEXT NOT NULL,

    CONSTRAINT "CertificacionHabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstudianteIdioma" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "idioma_id" TEXT NOT NULL,
    "nivel_oral" "public"."NivelIdioma" NOT NULL,
    "nivel_escrito" "public"."NivelIdioma" NOT NULL,
    "nivel_lectura" "public"."NivelIdioma" NOT NULL,
    "certificacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstudianteIdioma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentoEstudiante" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "public"."TipoDocumento" NOT NULL,
    "categoria" TEXT,
    "url" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "tamanio_kb" INTEGER NOT NULL,
    "descripcion" TEXT,
    "es_publico" BOOLEAN NOT NULL DEFAULT false,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoEstudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reconocimiento" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "public"."TipoReconocimiento" NOT NULL,
    "otorgante" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "url_evidencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reconocimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerfilEmpresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sector_id" TEXT,
    "tamanio" "public"."TamanioEmpresa" NOT NULL,
    "anio_fundacion" INTEGER,
    "tipo" "public"."TipoEmpresa" NOT NULL,
    "cultura_descripcion" TEXT,
    "mision" TEXT,
    "vision" TEXT,
    "linkedin_url" TEXT,
    "valores" JSONB[],
    "galeria" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BeneficioEmpresa" (
    "id" TEXT NOT NULL,
    "perfil_empresa_id" TEXT NOT NULL,
    "beneficio_id" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "BeneficioEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferenciaProfesional" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "relacion" "public"."TipoRelacion" NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "linkedin_url" TEXT,
    "estado" "public"."EstadoReferencia" NOT NULL DEFAULT 'PENDIENTE',
    "puede_contactar" BOOLEAN NOT NULL DEFAULT false,
    "testimonio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenciaProfesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogoCarrera" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "escuela" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogoCarrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogoHabilidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "public"."CategoriaHabilidad" NOT NULL,
    "tipo" "public"."TipoHabilidad" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogoHabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogoTecnologia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "public"."CategoriaTecnologia" NOT NULL,
    "logo_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogoTecnologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogoSector" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogoSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogoUbicacion" (
    "id" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'Perú',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogoUbicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogoIdioma" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_iso" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogoIdioma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogoBeneficio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "public"."CategoriaBeneficio" NOT NULL,
    "icono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogoBeneficio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_googleId_key" ON "public"."usuarios"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_usuarioId_key" ON "public"."estudiantes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_usuarioId_key" ON "public"."empresas"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_ruc_key" ON "public"."empresas"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "instituciones_usuarioId_key" ON "public"."instituciones"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "instituciones_codigo_key" ON "public"."instituciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "postulaciones_estudianteId_ofertaId_key" ON "public"."postulaciones"("estudianteId", "ofertaId");

-- CreateIndex
CREATE UNIQUE INDEX "respuestas_postulaciones_postulacionId_preguntaOfertaId_key" ON "public"."respuestas_postulaciones"("postulacionId", "preguntaOfertaId");

-- CreateIndex
CREATE UNIQUE INDEX "reacciones_usuarioId_postId_key" ON "public"."reacciones"("usuarioId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "reacciones_usuarioId_comentarioId_key" ON "public"."reacciones"("usuarioId", "comentarioId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_seguidorId_seguidoId_key" ON "public"."follows"("seguidorId", "seguidoId");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilProfesional_estudianteId_key" ON "public"."PerfilProfesional"("estudianteId");

-- CreateIndex
CREATE INDEX "PerfilProfesional_estudianteId_idx" ON "public"."PerfilProfesional"("estudianteId");

-- CreateIndex
CREATE INDEX "ExperienciaLaboral_estudianteId_idx" ON "public"."ExperienciaLaboral"("estudianteId");

-- CreateIndex
CREATE INDEX "ExperienciaLaboral_sector_id_idx" ON "public"."ExperienciaLaboral"("sector_id");

-- CreateIndex
CREATE INDEX "ExperienciaTecnologia_experiencia_id_idx" ON "public"."ExperienciaTecnologia"("experiencia_id");

-- CreateIndex
CREATE INDEX "ExperienciaTecnologia_tecnologia_id_idx" ON "public"."ExperienciaTecnologia"("tecnologia_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienciaTecnologia_experiencia_id_tecnologia_id_key" ON "public"."ExperienciaTecnologia"("experiencia_id", "tecnologia_id");

-- CreateIndex
CREATE INDEX "EducacionAcademica_estudianteId_idx" ON "public"."EducacionAcademica"("estudianteId");

-- CreateIndex
CREATE INDEX "EducacionAcademica_carrera_id_idx" ON "public"."EducacionAcademica"("carrera_id");

-- CreateIndex
CREATE INDEX "EstudianteHabilidad_estudianteId_idx" ON "public"."EstudianteHabilidad"("estudianteId");

-- CreateIndex
CREATE INDEX "EstudianteHabilidad_habilidad_id_idx" ON "public"."EstudianteHabilidad"("habilidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "EstudianteHabilidad_estudianteId_habilidad_id_key" ON "public"."EstudianteHabilidad"("estudianteId", "habilidad_id");

-- CreateIndex
CREATE INDEX "Proyecto_estudianteId_idx" ON "public"."Proyecto"("estudianteId");

-- CreateIndex
CREATE INDEX "Proyecto_tipo_idx" ON "public"."Proyecto"("tipo");

-- CreateIndex
CREATE INDEX "ProyectoTecnologia_proyecto_id_idx" ON "public"."ProyectoTecnologia"("proyecto_id");

-- CreateIndex
CREATE INDEX "ProyectoTecnologia_tecnologia_id_idx" ON "public"."ProyectoTecnologia"("tecnologia_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoTecnologia_proyecto_id_tecnologia_id_key" ON "public"."ProyectoTecnologia"("proyecto_id", "tecnologia_id");

-- CreateIndex
CREATE INDEX "Certificacion_estudianteId_idx" ON "public"."Certificacion"("estudianteId");

-- CreateIndex
CREATE INDEX "CertificacionHabilidad_certificacion_id_idx" ON "public"."CertificacionHabilidad"("certificacion_id");

-- CreateIndex
CREATE INDEX "CertificacionHabilidad_habilidad_id_idx" ON "public"."CertificacionHabilidad"("habilidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "CertificacionHabilidad_certificacion_id_habilidad_id_key" ON "public"."CertificacionHabilidad"("certificacion_id", "habilidad_id");

-- CreateIndex
CREATE INDEX "EstudianteIdioma_estudianteId_idx" ON "public"."EstudianteIdioma"("estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "EstudianteIdioma_estudianteId_idioma_id_key" ON "public"."EstudianteIdioma"("estudianteId", "idioma_id");

-- CreateIndex
CREATE INDEX "DocumentoEstudiante_estudianteId_idx" ON "public"."DocumentoEstudiante"("estudianteId");

-- CreateIndex
CREATE INDEX "DocumentoEstudiante_tipo_idx" ON "public"."DocumentoEstudiante"("tipo");

-- CreateIndex
CREATE INDEX "Reconocimiento_estudianteId_idx" ON "public"."Reconocimiento"("estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilEmpresa_empresaId_key" ON "public"."PerfilEmpresa"("empresaId");

-- CreateIndex
CREATE INDEX "PerfilEmpresa_empresaId_idx" ON "public"."PerfilEmpresa"("empresaId");

-- CreateIndex
CREATE INDEX "PerfilEmpresa_sector_id_idx" ON "public"."PerfilEmpresa"("sector_id");

-- CreateIndex
CREATE INDEX "BeneficioEmpresa_perfil_empresa_id_idx" ON "public"."BeneficioEmpresa"("perfil_empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "BeneficioEmpresa_perfil_empresa_id_beneficio_id_key" ON "public"."BeneficioEmpresa"("perfil_empresa_id", "beneficio_id");

-- CreateIndex
CREATE INDEX "ReferenciaProfesional_estudianteId_idx" ON "public"."ReferenciaProfesional"("estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoCarrera_nombre_key" ON "public"."CatalogoCarrera"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoHabilidad_nombre_key" ON "public"."CatalogoHabilidad"("nombre");

-- CreateIndex
CREATE INDEX "CatalogoHabilidad_categoria_idx" ON "public"."CatalogoHabilidad"("categoria");

-- CreateIndex
CREATE INDEX "CatalogoHabilidad_tipo_idx" ON "public"."CatalogoHabilidad"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoTecnologia_nombre_key" ON "public"."CatalogoTecnologia"("nombre");

-- CreateIndex
CREATE INDEX "CatalogoTecnologia_categoria_idx" ON "public"."CatalogoTecnologia"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoSector_nombre_key" ON "public"."CatalogoSector"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoIdioma_nombre_key" ON "public"."CatalogoIdioma"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoIdioma_codigo_iso_key" ON "public"."CatalogoIdioma"("codigo_iso");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoBeneficio_nombre_key" ON "public"."CatalogoBeneficio"("nombre");

-- CreateIndex
CREATE INDEX "CatalogoBeneficio_categoria_idx" ON "public"."CatalogoBeneficio"("categoria");

-- AddForeignKey
ALTER TABLE "public"."estudiantes" ADD CONSTRAINT "estudiantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."empresas" ADD CONSTRAINT "empresas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instituciones" ADD CONSTRAINT "instituciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ofertas" ADD CONSTRAINT "ofertas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."postulaciones" ADD CONSTRAINT "postulaciones_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."postulaciones" ADD CONSTRAINT "postulaciones_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "public"."ofertas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preguntas_ofertas" ADD CONSTRAINT "preguntas_ofertas_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "public"."ofertas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."respuestas_postulaciones" ADD CONSTRAINT "respuestas_postulaciones_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "public"."postulaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."respuestas_postulaciones" ADD CONSTRAINT "respuestas_postulaciones_preguntaOfertaId_fkey" FOREIGN KEY ("preguntaOfertaId") REFERENCES "public"."preguntas_ofertas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comentarios" ADD CONSTRAINT "comentarios_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comentarios" ADD CONSTRAINT "comentarios_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comentarios" ADD CONSTRAINT "comentarios_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reacciones" ADD CONSTRAINT "reacciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reacciones" ADD CONSTRAINT "reacciones_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reacciones" ADD CONSTRAINT "reacciones_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "public"."comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_seguidorId_fkey" FOREIGN KEY ("seguidorId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_seguidoId_fkey" FOREIGN KEY ("seguidoId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilProfesional" ADD CONSTRAINT "PerfilProfesional_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExperienciaLaboral" ADD CONSTRAINT "ExperienciaLaboral_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExperienciaLaboral" ADD CONSTRAINT "ExperienciaLaboral_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."CatalogoSector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExperienciaLaboral" ADD CONSTRAINT "ExperienciaLaboral_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."CatalogoUbicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExperienciaTecnologia" ADD CONSTRAINT "ExperienciaTecnologia_experiencia_id_fkey" FOREIGN KEY ("experiencia_id") REFERENCES "public"."ExperienciaLaboral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExperienciaTecnologia" ADD CONSTRAINT "ExperienciaTecnologia_tecnologia_id_fkey" FOREIGN KEY ("tecnologia_id") REFERENCES "public"."CatalogoTecnologia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducacionAcademica" ADD CONSTRAINT "EducacionAcademica_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducacionAcademica" ADD CONSTRAINT "EducacionAcademica_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "public"."CatalogoCarrera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducacionAcademica" ADD CONSTRAINT "EducacionAcademica_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."CatalogoUbicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstudianteHabilidad" ADD CONSTRAINT "EstudianteHabilidad_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstudianteHabilidad" ADD CONSTRAINT "EstudianteHabilidad_habilidad_id_fkey" FOREIGN KEY ("habilidad_id") REFERENCES "public"."CatalogoHabilidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proyecto" ADD CONSTRAINT "Proyecto_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProyectoTecnologia" ADD CONSTRAINT "ProyectoTecnologia_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "public"."Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProyectoTecnologia" ADD CONSTRAINT "ProyectoTecnologia_tecnologia_id_fkey" FOREIGN KEY ("tecnologia_id") REFERENCES "public"."CatalogoTecnologia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Certificacion" ADD CONSTRAINT "Certificacion_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificacionHabilidad" ADD CONSTRAINT "CertificacionHabilidad_certificacion_id_fkey" FOREIGN KEY ("certificacion_id") REFERENCES "public"."Certificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificacionHabilidad" ADD CONSTRAINT "CertificacionHabilidad_habilidad_id_fkey" FOREIGN KEY ("habilidad_id") REFERENCES "public"."CatalogoHabilidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstudianteIdioma" ADD CONSTRAINT "EstudianteIdioma_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstudianteIdioma" ADD CONSTRAINT "EstudianteIdioma_idioma_id_fkey" FOREIGN KEY ("idioma_id") REFERENCES "public"."CatalogoIdioma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoEstudiante" ADD CONSTRAINT "DocumentoEstudiante_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reconocimiento" ADD CONSTRAINT "Reconocimiento_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilEmpresa" ADD CONSTRAINT "PerfilEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilEmpresa" ADD CONSTRAINT "PerfilEmpresa_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."CatalogoSector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BeneficioEmpresa" ADD CONSTRAINT "BeneficioEmpresa_perfil_empresa_id_fkey" FOREIGN KEY ("perfil_empresa_id") REFERENCES "public"."PerfilEmpresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BeneficioEmpresa" ADD CONSTRAINT "BeneficioEmpresa_beneficio_id_fkey" FOREIGN KEY ("beneficio_id") REFERENCES "public"."CatalogoBeneficio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferenciaProfesional" ADD CONSTRAINT "ReferenciaProfesional_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "public"."estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
