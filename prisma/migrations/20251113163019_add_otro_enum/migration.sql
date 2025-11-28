-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NivelAcademico" ADD VALUE 'LICENCIATURA';
ALTER TYPE "public"."NivelAcademico" ADD VALUE 'SECUNDARIA';

-- AlterEnum
ALTER TYPE "public"."SistemaNotas" ADD VALUE 'OTRO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."TipoCertificacion" ADD VALUE 'TECNICA';
ALTER TYPE "public"."TipoCertificacion" ADD VALUE 'IDIOMAS';
ALTER TYPE "public"."TipoCertificacion" ADD VALUE 'CURSO';
ALTER TYPE "public"."TipoCertificacion" ADD VALUE 'OTRO';

-- CreateTable
CREATE TABLE "public"."lead_estudiantes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "studentId" TEXT,
    "career" TEXT NOT NULL,
    "enrollmentYear" INTEGER NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_empresas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "companyName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "lookingFor" TEXT NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_empresas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_estudiantes_email_idx" ON "public"."lead_estudiantes"("email");

-- CreateIndex
CREATE INDEX "lead_estudiantes_processed_idx" ON "public"."lead_estudiantes"("processed");

-- CreateIndex
CREATE INDEX "lead_estudiantes_createdAt_idx" ON "public"."lead_estudiantes"("createdAt");

-- CreateIndex
CREATE INDEX "lead_empresas_email_idx" ON "public"."lead_empresas"("email");

-- CreateIndex
CREATE INDEX "lead_empresas_processed_idx" ON "public"."lead_empresas"("processed");

-- CreateIndex
CREATE INDEX "lead_empresas_createdAt_idx" ON "public"."lead_empresas"("createdAt");
