import { Prisma, NivelDominio, TipoCertificacion, NivelAcademico, TipoInstitucion, SistemaNotas, TipoProyecto, EstadoProyecto, ContextoProyecto, TipoHabilidad, CategoriaHabilidad, NivelIdioma } from '@prisma/client';
import prisma from '../config/database';
import {
  UserProfile,
  StudentProfile,
  CompanyProfile,
  InstitutionProfile,
  UpdateUserRequest,
  UpdateStudentProfileRequest,
  UpdateCompanyRequest,
  UpdateInstitutionRequest,
  FollowInfo,
  UserSearchFilter,
} from '../types/user.types';
import { UserRole, StudentType, PaginationResult, NotificationType } from '../types/common.types';
import { paginationUtils } from '../utils/helpers';
import logger from '../utils/logger';
import { NotificationsService } from './notifications.service';

export class UsersService {
  // Obtener perfil de usuario por ID
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          avatar: true,
          rol: true,
          activo: true,
          emailVerificado: true,
          perfilCompleto: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        ...user,
        rol: user.rol as UserRole,
        avatar: user.avatar || undefined,
      };
    } catch (error: any) {
      logger.error('Error obteniendo usuario por ID:', error, { userId });
      throw error;
    }
  }

  // Obtener perfil completo de estudiante
  async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    try {
      const student = await prisma.estudiante.findUnique({
        where: { usuarioId: userId },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
              activo: true,
              emailVerificado: true,
              perfilCompleto: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          // --- NUEVAS RELACIONES INCLUIDAS ---
          perfilProfesional: true,
          experiencias: {
            include: {
              tecnologias: { include: { tecnologia: true } },
            },
          },
          educacion: true,
          habilidadesNuevas: {
            include: {
              habilidad: true,
            },
          },
          proyectos: {
            include: {
              tecnologias: { include: { tecnologia: true } },
            },
          },
          certificaciones: {
            include: {
              habilidades: { include: { habilidad: true } },
            },
          },
          idiomas: {
            include: {
              idioma: true,
            },
          },
        },
      });

      if (!student) {
        return null;
      }

      // Mapeo para asegurar que los tipos coincidan con las interfaces
      return {
        ...student,
        tipo: student.tipo as StudentType,
        cv: student.cv || undefined,
        universidad: student.universidad || undefined,
        anio_ingreso: student.anio_ingreso || undefined,
        anio_egreso: student.anio_egreso || undefined,
        telefono: student.telefono || undefined,
        portafolio: student.portafolio || undefined,
        linkedin: student.linkedin || undefined,
        github: student.github || undefined,
        ubicacion: student.ubicacion || undefined,
        usuario: {
          ...student.usuario,
          rol: student.usuario.rol as UserRole,
          avatar: student.usuario.avatar || undefined,
        },
        // Asegurar que los campos nulos se manejen correctamente
        perfilProfesional: student.perfilProfesional || null,
        experiencias: student.experiencias || [],
        educacion: student.educacion || [],
        habilidadesNuevas: student.habilidadesNuevas || [],
        proyectos: student.proyectos || [],
        certificaciones: student.certificaciones || [],
        idiomas: student.idiomas || [],
      };
    } catch (error: any) {
      logger.error('Error obteniendo perfil de estudiante:', error, { userId });
      throw error;
    }
  }

  // Helper para procesar habilidades anidadas en certificaciones
  private async processNestedHabilidadesCertificacion(
    habilidades: Array<{ id?: string; nombre: string }>
  ) {
    if (!habilidades || habilidades.length === 0) {
      return undefined;
    }

    const processedHabilidades = [];
    for (const hab of habilidades) {
      if (hab.id) {
        // Conectar a una habilidad existente
        processedHabilidades.push({
          habilidad: {
            connect: { id: hab.id },
          },
        });
      } else if (hab.nombre) {
        // Buscar o crear la habilidad en el catálogo
        const catalogoHabilidad = await prisma.catalogoHabilidad.upsert({
          where: { nombre: hab.nombre },
          create: { nombre: hab.nombre, categoria: 'OTRO', tipo: 'TECNICA' }, // Valores por defecto, ajustar si es necesario
          update: {},
        });

        processedHabilidades.push({
          habilidad: {
            connect: { id: catalogoHabilidad.id },
          },
        });
      }
    }
    return { create: processedHabilidades };
  }

  // Helper para procesar tecnologías anidadas (experiencias y proyectos)
  private async processNestedTechnologies(
    technologies: Array<{ id?: string; nombre: string; nivel?: NivelDominio; anios_experiencia?: number }>
  ) {
    if (!technologies || technologies.length === 0) {
      return undefined;
    }

    const processedTechnologies = [];
    for (const tech of technologies) {
      if (tech.id) {
        // Conectar a una tecnología existente
        processedTechnologies.push({
          nivel: tech.nivel ?? NivelDominio.BASICO,
          anios_experiencia: tech.anios_experiencia ?? 0,
          tecnologia: {
            connect: { id: tech.id },
          },
        });
      } else if (tech.nombre) {
        // Buscar o crear la tecnología en el catálogo
        const catalogoTecnologia = await prisma.catalogoTecnologia.upsert({
          where: { nombre: tech.nombre },
          create: { nombre: tech.nombre, categoria: 'OTRO' }, // Añadido categoria
          update: {},
        });

        processedTechnologies.push({
          nivel: tech.nivel ?? NivelDominio.BASICO,
          anios_experiencia: tech.anios_experiencia ?? 0,
          tecnologia: {
            connect: { id: catalogoTecnologia.id },
          },
        });
      }
    }
    return { create: processedTechnologies };
  }

  // Actualizar perfil de estudiante con operaciones anidadas
  async updateStudentProfile(
    userId: string,
    updateData: UpdateStudentProfileRequest
  ): Promise<StudentProfile> {
    try {
      const { perfilProfesional, experiencias, educacion, proyectos, certificaciones, idiomas, habilidadesNuevas, ...studentData } = updateData;

      const updatePayload: Prisma.EstudianteUpdateInput = {
        ...studentData,
      };

      // --- MANEJO DE OPERACIONES ANIDADAS ---

      if (perfilProfesional) {
        updatePayload.perfilProfesional = {
          upsert: {
            create: perfilProfesional.upsert.create!,
            update: perfilProfesional.upsert.update!,
          },
        };
      }

      if (experiencias) {
        const createExperiencias = experiencias.create || [];
        const updateExperiencias = experiencias.update || [];
        const deleteExperiencias = experiencias.delete || [];

        const processedCreateExperiencias = (await Promise.all(
          createExperiencias.map(async (exp) => {
            const tecnologias = await this.processNestedTechnologies((exp.tecnologias as any[]) || []);
            const { tecnologias: _, ...rest } = exp; // Destructurar para omitir 'tecnologias'
            return {
              ...rest,
              ...(tecnologias ? { tecnologias } : {}),
            };
          })
        )).filter(Boolean);

        const processedUpdateExperiencias = (await Promise.all(
          updateExperiencias.map(async (exp) => {
            const tecnologias = await this.processNestedTechnologies((exp.data.tecnologias as any[]) || []);
            const { tecnologias: _, ...rest } = exp.data; // Destructurar para omitir 'tecnologias'
            return {
              where: exp.where,
              data: {
                ...rest,
                ...(tecnologias ? { tecnologias } : {}),
              },
            };
          })
        )).filter(Boolean);

        const processedDeleteExperiencias = deleteExperiencias.filter(Boolean);

        const experienciasToUpdate: Prisma.ExperienciaLaboralUpdateManyWithoutEstudianteNestedInput = {};
        if (processedCreateExperiencias.length > 0) experienciasToUpdate.create = processedCreateExperiencias;
        if (processedUpdateExperiencias.length > 0) experienciasToUpdate.update = processedUpdateExperiencias.map(u => ({ where: u.where, data: u.data as any }));
        if (processedDeleteExperiencias.length > 0) experienciasToUpdate.delete = processedDeleteExperiencias;

        if (Object.keys(experienciasToUpdate).length > 0) {
          updatePayload.experiencias = experienciasToUpdate;
        }
      }

      if (educacion) {
        const createEducacion = educacion.create || [];
        const updateEducacion = educacion.update || [];
        const deleteEducacion = educacion.delete || [];

        const processedCreateEducacion = createEducacion.map((edu) => ({
          ...edu,
          tipo_institucion: edu.tipo_institucion as TipoInstitucion,
          nivel_academico: edu.nivel_academico as NivelAcademico,
          sistema_notas: edu.sistema_notas as SistemaNotas,
        })).filter(Boolean);

        const processedUpdateEducacion = updateEducacion.map((edu) => ({
          where: edu.where,
          data: {
            ...edu.data,
            tipo_institucion: edu.data.tipo_institucion as TipoInstitucion,
            nivel_academico: edu.data.nivel_academico as NivelAcademico,
            sistema_notas: edu.data.sistema_notas as SistemaNotas,
          },
        })).filter(Boolean);

        const processedDeleteEducacion = deleteEducacion.filter(Boolean);

        const educacionToUpdate: Prisma.EducacionAcademicaUpdateManyWithoutEstudianteNestedInput = {};
        if (processedCreateEducacion.length > 0) educacionToUpdate.create = processedCreateEducacion;
        if (processedUpdateEducacion.length > 0) educacionToUpdate.update = processedUpdateEducacion.map(u => ({ where: u.where, data: u.data as any }));
        if (processedDeleteEducacion.length > 0) educacionToUpdate.delete = processedDeleteEducacion;

        if (Object.keys(educacionToUpdate).length > 0) {
          updatePayload.educacion = educacionToUpdate;
        }
      }

      if (proyectos) {
        const createProyectos = proyectos.create || [];
        const updateProyectos = proyectos.update || [];
        const deleteProyectos = proyectos.delete || [];

        const processedCreateProyectos = (await Promise.all(
          createProyectos.map(async (proj) => {
            const tecnologias = await this.processNestedTechnologies((proj.tecnologias as any[]) || []);
            const { tecnologias: _, ...rest } = proj; // Destructurar para omitir 'tecnologias'
            return {
              ...rest,
              tipo: rest.tipo as TipoProyecto,
              estado: rest.estado as EstadoProyecto,
              contexto: rest.contexto as ContextoProyecto,
              ...(tecnologias ? { tecnologias } : {}),
            };
          })
        )).filter(Boolean);

        const processedUpdateProyectos = (await Promise.all(
          updateProyectos.map(async (proj) => {
            const tecnologias = await this.processNestedTechnologies((proj.data.tecnologias as any[]) || []);
            const { tecnologias: _, ...rest } = proj.data; // Destructurar para omitir 'tecnologias'
            return {
              where: proj.where,
              data: {
                ...rest,
                tipo: rest.tipo as TipoProyecto,
                estado: rest.estado as EstadoProyecto,
                contexto: rest.contexto as ContextoProyecto,
                ...(tecnologias ? { tecnologias } : {}),
              },
            };
          })
        )).filter(Boolean);

        const processedDeleteProyectos = deleteProyectos.filter(Boolean);

        const proyectosToUpdate: Prisma.ProyectoUpdateManyWithoutEstudianteNestedInput = {};
        if (processedCreateProyectos.length > 0) proyectosToUpdate.create = processedCreateProyectos;
        if (processedUpdateProyectos.length > 0) proyectosToUpdate.update = processedUpdateProyectos.map(u => ({ where: u.where, data: u.data as any }));
        if (processedDeleteProyectos.length > 0) proyectosToUpdate.delete = processedDeleteProyectos;

        if (Object.keys(proyectosToUpdate).length > 0) {
          updatePayload.proyectos = proyectosToUpdate;
        }
      }

      if (certificaciones) {
        const createCertificaciones = certificaciones.create || [];
        const updateCertificaciones = certificaciones.update || [];
        const deleteCertificaciones = certificaciones.delete || [];

        const processedCreateCertificaciones = (await Promise.all(
          createCertificaciones.map(async (cert) => {
            const habilidades = await this.processNestedHabilidadesCertificacion((cert.habilidades as any[]) || []);
            const { habilidades: _, ...rest } = cert; // Destructurar para omitir 'habilidades'
            return {
              ...rest,
              tipo: rest.tipo as TipoCertificacion, // Asegurar que el tipo sea correcto
              ...(habilidades ? { habilidades } : {}),
            };
          })
        )).filter(Boolean);

        const processedUpdateCertificaciones = (await Promise.all(
          updateCertificaciones.map(async (cert) => {
            const habilidades = await this.processNestedHabilidadesCertificacion((cert.data.habilidades as any[]) || []);
            const { habilidades: _, ...rest } = cert.data; // Destructurar para omitir 'habilidades'
            return {
              where: cert.where,
              data: {
                ...rest,
                tipo: rest.tipo as TipoCertificacion, // Asegurar que el tipo sea correcto
                ...(habilidades ? { habilidades } : {}),
              },
            };
          })
        )).filter(Boolean);

        const processedDeleteCertificaciones = deleteCertificaciones.filter(Boolean);

        const certificacionesToUpdate: Prisma.CertificacionUpdateManyWithoutEstudianteNestedInput = {};
        if (processedCreateCertificaciones.length > 0) certificacionesToUpdate.create = processedCreateCertificaciones;
        if (processedUpdateCertificaciones.length > 0) certificacionesToUpdate.update = processedUpdateCertificaciones.map(u => ({ where: u.where, data: u.data as any }));
        if (processedDeleteCertificaciones.length > 0) certificacionesToUpdate.delete = processedDeleteCertificaciones;

        if (Object.keys(certificacionesToUpdate).length > 0) {
          updatePayload.certificaciones = certificacionesToUpdate;
        }
      }

      if (idiomas) {
        const createIdiomas = idiomas.create || [];
        const updateIdiomas = idiomas.update || [];
        const deleteIdiomas = idiomas.delete || [];

        // Procesar creación de idiomas - manejar relación con CatalogoIdioma
        const processedCreateIdiomas = [];
        for (const idioma of createIdiomas) {
          try {
            // Verificar si el idioma tiene datos de idioma anidados
            const idiomaData = (idioma as any).idioma;

            if (idiomaData && idiomaData.nombre && idiomaData.codigo_iso) {
              // Buscar si existe un idioma con ese nombre o código ISO
              let catalogoIdioma = await prisma.catalogoIdioma.findFirst({
                where: {
                  OR: [
                    { nombre: idiomaData.nombre },
                    { codigo_iso: idiomaData.codigo_iso }
                  ]
                }
              });

              // Si no existe, crearlo
              if (!catalogoIdioma) {
                catalogoIdioma = await prisma.catalogoIdioma.create({
                  data: {
                    nombre: idiomaData.nombre,
                    codigo_iso: idiomaData.codigo_iso
                  }
                });
              }

              processedCreateIdiomas.push({
                idioma: {
                  connect: { id: catalogoIdioma.id }
                },
                nivel_oral: idioma.nivel_oral as NivelIdioma,
                nivel_escrito: idioma.nivel_escrito as NivelIdioma,
                nivel_lectura: idioma.nivel_lectura as NivelIdioma,
              });
            } else {
              // Si ya viene con idioma_id o similar, pasar los datos directamente
              processedCreateIdiomas.push({
                ...idioma
              });
            }
          } catch (error) {
            logger.error('Error procesando idioma para crear:', error, { idioma });
            // Continuar con el siguiente idioma en lugar de fallar todo
            continue;
          }
        }

        const processedUpdateIdiomas = updateIdiomas.map((idioma) => ({
          where: idioma.where,
          data: {
            ...idioma.data,
            nivel_oral: idioma.data.nivel_oral as NivelIdioma,
            nivel_escrito: idioma.data.nivel_escrito as NivelIdioma,
            nivel_lectura: idioma.data.nivel_lectura as NivelIdioma,
          },
        })).filter(Boolean);

        const processedDeleteIdiomas = deleteIdiomas.filter(Boolean);

        const idiomasToUpdate: Prisma.EstudianteIdiomaUpdateManyWithoutEstudianteNestedInput = {};
        if (processedCreateIdiomas.length > 0) idiomasToUpdate.create = processedCreateIdiomas;
        if (processedUpdateIdiomas.length > 0) idiomasToUpdate.update = processedUpdateIdiomas.map(u => ({ where: u.where, data: u.data as any }));
        if (processedDeleteIdiomas.length > 0) idiomasToUpdate.delete = processedDeleteIdiomas;

        if (Object.keys(idiomasToUpdate).length > 0) {
          updatePayload.idiomas = idiomasToUpdate;
        }
      }

      if (habilidadesNuevas) {
        // Procesar habilidades: crear en catálogo si no existen
        const createHabilidades = habilidadesNuevas.create || [];
        const processedCreate = [];

        for (const hab of createHabilidades) {
          if (hab.habilidad) {
            // Buscar o crear habilidad en el catálogo
            const habilidadCatalogo = await prisma.catalogoHabilidad.upsert({
              where: { nombre: hab.habilidad.nombre },
              create: {
                nombre: hab.habilidad.nombre,
                categoria: hab.habilidad.categoria as CategoriaHabilidad,
                tipo: hab.habilidad.tipo as TipoHabilidad,
              },
              update: {},
            });

            processedCreate.push({
              nivel: (hab.nivel as NivelDominio) ?? NivelDominio.BASICO,
              anios_experiencia: hab.anios_experiencia ?? 0,
              habilidad: {
                connect: { id: habilidadCatalogo.id },
              },
            });
          } else if (hab.habilidadId) {
            processedCreate.push({
              nivel: (hab.nivel as NivelDominio) ?? NivelDominio.BASICO,
              anios_experiencia: hab.anios_experiencia ?? 0,
              habilidad: {
                connect: { id: hab.habilidadId },
              },
            });
          }
        }

        const processedUpdateHabilidades = habilidadesNuevas.update?.map((hab) => ({
          where: hab.where,
          data: {
            ...hab.data,
            nivel: hab.data.nivel as NivelDominio,
          },
        })).filter(Boolean) || [];

        const processedDeleteHabilidades = habilidadesNuevas.delete?.filter(Boolean) || [];

        const habilidadesToUpdate: Prisma.EstudianteHabilidadUpdateManyWithoutEstudianteNestedInput = {};
        if (processedCreate.length > 0) habilidadesToUpdate.create = processedCreate;
        if (processedUpdateHabilidades.length > 0) habilidadesToUpdate.update = processedUpdateHabilidades.map(u => ({ where: u.where, data: u.data as any }));
        if (processedDeleteHabilidades.length > 0) habilidadesToUpdate.delete = processedDeleteHabilidades;

        if (Object.keys(habilidadesToUpdate).length > 0) {
          updatePayload.habilidadesNuevas = habilidadesToUpdate;
        }
      }

      await prisma.estudiante.update({
        where: { usuarioId: userId },
        data: updatePayload,
      });

      const updatedProfile = await this.getStudentProfile(userId);

      if (!updatedProfile) {
        throw new Error('No se pudo obtener el perfil actualizado del estudiante.');
      }

      // Verificar si el perfil está completo y actualizar
      const perfilCompleto = this.checkStudentProfileCompletion(updatedProfile);
      if (updatedProfile.usuario.perfilCompleto !== perfilCompleto) {
        await prisma.usuario.update({
          where: { id: userId },
          data: { perfilCompleto },
        });
        updatedProfile.usuario.perfilCompleto = perfilCompleto;
      }

      logger.info('Perfil de estudiante actualizado:', { userId });

      return updatedProfile;

    } catch (error: any) {
      logger.error('Error actualizando perfil de estudiante:', error, { userId });
      throw error;
    }
  }

  // Verificar completitud de perfil de estudiante
  private checkStudentProfileCompletion(student: any): boolean {
    // Lógica mejorada para verificar la completitud del perfil
    return !!(
      student.carrera &&
      student.usuario.nombre &&
      student.usuario.apellido &&
      student.perfilProfesional?.resumen &&
      student.experiencias?.length > 0 &&
      student.educacion?.length > 0 &&
      student.habilidadesNuevas?.length > 0
    );
  }

  // ... (resto de los métodos del servicio sin cambios)

  // Obtener perfil completo de empresa
  async getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
    try {
      const company = await prisma.empresa.findUnique({
        where: { usuarioId: userId },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
              activo: true,
              emailVerificado: true,
              perfilCompleto: true,
              createdAt: true,
              updatedAt: true
            }
          },
          perfilEmpresa: {
            include: {
              beneficios: {
                include: {
                  beneficio: true
                }
              }
            }
          }
        }
      });

      if (!company) {
        return null;
      }

      return {
        ...company,
        descripcion: company.descripcion || undefined,
        direccion: company.direccion || undefined,
        telefono: company.telefono || undefined,
        website: company.website || undefined,
        logo_url: company.logo_url || undefined,
        usuario: {
          ...company.usuario,
          rol: company.usuario.rol as UserRole,
          avatar: company.usuario.avatar || undefined
        },
        perfilEmpresa: company.perfilEmpresa || undefined, // Return the profile
      };
    } catch (error: any) {
      logger.error('Error obteniendo perfil de empresa:', error, { userId });
      throw error;
    }
  }

  // Obtener perfil completo de institución
  async getInstitutionProfile(userId: string): Promise<InstitutionProfile | null> {
    try {
      const institution = await prisma.institucion.findUnique({
        where: { usuarioId: userId },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
              activo: true,
              emailVerificado: true,
              perfilCompleto: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      if (!institution) {
        return null;
      }

      return {
        ...institution,
        direccion: institution.direccion || undefined,
        telefono: institution.telefono || undefined,
        website: institution.website || undefined,
        logo_url: institution.logo_url || undefined,
        usuario: {
          ...institution.usuario,
          rol: institution.usuario.rol as UserRole,
          avatar: institution.usuario.avatar || undefined
        }
      };
    } catch (error: any) {
      logger.error('Error obteniendo perfil de institución:', error, { userId });
      throw error;
    }
  }

  // Actualizar información básica del usuario
  async updateUser(userId: string, updateData: UpdateUserRequest): Promise<UserProfile> {
    try {
      // Filtrar solo los campos válidos para el usuario (evitar campos de perfil de estudiante)
      const validUserFields = {
        ...(updateData.nombre && { nombre: updateData.nombre }),
        ...(updateData.apellido && { apellido: updateData.apellido }),
        ...(updateData.avatar && { avatar: updateData.avatar }),
      };

      const updatedUser = await prisma.usuario.update({
        where: { id: userId },
        data: {
          ...validUserFields,
          updatedAt: new Date()
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          avatar: true,
          rol: true,
          activo: true,
          emailVerificado: true,
          perfilCompleto: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info('Usuario actualizado:', { userId, updateData });

      return {
        ...updatedUser,
        rol: updatedUser.rol as UserRole,
        avatar: updatedUser.avatar || undefined
      };
    } catch (error: any) {
      logger.error('Error actualizando usuario:', error, { userId, updateData });
      throw error;
    }
  }

  // Actualizar perfil de empresa
  async updateCompanyProfile(userId: string, updateData: UpdateCompanyRequest): Promise<CompanyProfile> {
    try {
      const { perfilEmpresa, ...companyData } = updateData;

      const updatePayload: Prisma.EmpresaUpdateInput = {
        ...companyData,
        updatedAt: new Date()
      };

      if (perfilEmpresa) {
        updatePayload.perfilEmpresa = {
          upsert: {
            create: perfilEmpresa.upsert.create,
            update: perfilEmpresa.upsert.update,
          },
        };
      }

      const updatedCompany = await prisma.empresa.update({
        where: { usuarioId: userId },
        data: updatePayload,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
              activo: true,
              emailVerificado: true,
              perfilCompleto: true,
              createdAt: true,
              updatedAt: true
            }
          },
          perfilEmpresa: true, // Include the updated profile
        }
      });

      // Verificar si el perfil está completo y actualizar
      const perfilCompleto = this.checkCompanyProfileCompletion(updatedCompany);
      if (updatedCompany.usuario.perfilCompleto !== perfilCompleto) {
        await prisma.usuario.update({
          where: { id: userId },
          data: { perfilCompleto }
        });
      }

      logger.info('Perfil de empresa actualizado:', { userId, updateData });

      return {
        ...updatedCompany,
        descripcion: updatedCompany.descripcion || undefined,
        direccion: updatedCompany.direccion || undefined,
        telefono: updatedCompany.telefono || undefined,
        website: updatedCompany.website || undefined,
        logo_url: updatedCompany.logo_url || undefined,
        usuario: {
          ...updatedCompany.usuario,
          rol: updatedCompany.usuario.rol as UserRole,
          avatar: updatedCompany.usuario.avatar || undefined,
          perfilCompleto
        },
        perfilEmpresa: updatedCompany.perfilEmpresa || undefined, // Return the profile
      };
    } catch (error: any) {
      logger.error('Error actualizando perfil de empresa:', error, { userId, updateData });
      throw error;
    }
  }

  // Actualizar perfil de institución
  async updateInstitutionProfile(userId: string, updateData: UpdateInstitutionRequest): Promise<InstitutionProfile> {
    try {
      const updatedInstitution = await prisma.institucion.update({
        where: { usuarioId: userId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
              activo: true,
              emailVerificado: true,
              perfilCompleto: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      logger.info('Perfil de institución actualizado:', { userId, updateData });

      return {
        ...updatedInstitution,
        direccion: updatedInstitution.direccion || undefined,
        telefono: updatedInstitution.telefono || undefined,
        website: updatedInstitution.website || undefined,
        logo_url: updatedInstitution.logo_url || undefined,
        usuario: {
          ...updatedInstitution.usuario,
          rol: updatedInstitution.usuario.rol as UserRole,
          avatar: updatedInstitution.usuario.avatar || undefined
        }
      };
    } catch (error: any) {
      logger.error('Error actualizando perfil de institución:', error, { userId, updateData });
      throw error;
    }
  }

  async viewProfile(studentUserId: string, companyUserId: string): Promise<void> {
    try {
      const student = await prisma.estudiante.findUnique({
        where: { usuarioId: studentUserId },
        include: { usuario: true }
      });

      if (!student) {
        throw new Error('STUDENT_PROFILE_NOT_FOUND');
      }

      const company = await prisma.empresa.findUnique({
        where: { usuarioId: companyUserId },
      });

      if (!company) {
        throw new Error('COMPANY_PROFILE_NOT_FOUND');
      }

      await new NotificationsService().createNotification({
        titulo: 'Tu perfil ha sido visto',
        mensaje: `La empresa ${company.nombre_empresa} ha visto tu perfil`,
        tipo: NotificationType.ACTUALIZACION_PERFIL,
        destinatarioId: student.usuarioId,
        remitenteId: companyUserId,
        metadata: {
          companyId: company.id
        }
      });

    } catch (error) {
      logger.error('Error viendo perfil:', error);
      throw error;
    }
  }

  // Seguir a un usuario
  async followUser(followerId: string, followedId: string): Promise<FollowInfo> {
    try {
      if (followerId === followedId) {
        throw new Error('CANNOT_FOLLOW_YOURSELF');
      }

      // Verificar que ambos usuarios existen
      const [follower, followed] = await Promise.all([
        prisma.usuario.findUnique({ where: { id: followerId } }),
        prisma.usuario.findUnique({ where: { id: followedId } })
      ]);

      if (!follower || !followed) {
        throw new Error('USER_NOT_FOUND');
      }

      // Verificar si ya lo sigue
      const existingFollow = await prisma.follow.findUnique({
        where: {
          seguidorId_seguidoId: {
            seguidorId: followerId,
            seguidoId: followedId
          }
        }
      });

      if (existingFollow) {
        throw new Error('ALREADY_FOLLOWING');
      }

      const follow = await prisma.follow.create({
        data: {
          seguidorId: followerId,
          seguidoId: followedId
        },
        include: {
          seguidor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
              activo: true,
              emailVerificado: true,
              perfilCompleto: true,
              createdAt: true,
              updatedAt: true
            }
          },
          seguido: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
              activo: true,
              emailVerificado: true,
              perfilCompleto: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      logger.info('Usuario seguido:', { followerId, followedId });

      return {
        ...follow,
        seguidor: {
          ...follow.seguidor,
          rol: follow.seguidor.rol as UserRole,
          avatar: follow.seguidor.avatar || undefined
        },
        seguido: {
          ...follow.seguido,
          rol: follow.seguido.rol as UserRole,
          avatar: follow.seguido.avatar || undefined
        }
      };
    } catch (error: any) {
      logger.error('Error siguiendo usuario:', error, { followerId, followedId });
      throw error;
    }
  }

  // Dejar de seguir a un usuario
  async unfollowUser(followerId: string, followedId: string): Promise<void> {
    try {
      const deletedFollow = await prisma.follow.deleteMany({
        where: {
          seguidorId: followerId,
          seguidoId: followedId
        }
      });

      if (deletedFollow.count === 0) {
        throw new Error('NOT_FOLLOWING');
      }

      logger.info('Usuario no seguido:', { followerId, followedId });
    } catch (error: any) {
      logger.error('Error dejando de seguir usuario:', error, { followerId, followedId });
      throw error;
    }
  }

  // Buscar usuarios con filtros y paginación
  async searchUsers(filters: UserSearchFilter, page: number = 1, limit: number = 10): Promise<PaginationResult<UserProfile>> {
    try {
      const { offset, limit: pageLimit } = paginationUtils.calculatePagination({ page: page.toString(), limit: limit.toString() });

      const where: Prisma.UsuarioWhereInput = {
        activo: filters.activo !== undefined ? filters.activo : true,
        emailVerificado: filters.verificado
      };

      if (filters.rol) {
        where.rol = filters.rol;
      }

      if (filters.search) {
        where.OR = [
          { nombre: { contains: filters.search, mode: 'insensitive' } },
          { apellido: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.usuario.findMany({
          where,
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            avatar: true,
            rol: true,
            activo: true,
            emailVerificado: true,
            perfilCompleto: true,
            createdAt: true,
            updatedAt: true
          },
          skip: offset,
          take: pageLimit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.usuario.count({ where })
      ]);

      const formattedUsers: UserProfile[] = users.map(user => ({
        ...user,
        rol: user.rol as UserRole,
        avatar: user.avatar || undefined
      }));

      return paginationUtils.createPaginatedResult(formattedUsers, total, page, pageLimit);
    } catch (error: any) {
      logger.error('Error buscando usuarios:', error, { filters, page, limit });
      throw error;
    }
  }

  // Verificar completitud de perfil de empresa
  private checkCompanyProfileCompletion(company: any): boolean {
    return !!(
      company.ruc &&
      company.nombre_empresa &&
      company.rubro &&
      company.descripcion &&
      company.usuario.nombre &&
      company.usuario.apellido &&
      company.usuario.email
    );
  }

  // Desactivar cuenta de usuario
  async deactivateUser(userId: string): Promise<void> {
    try {
      await prisma.usuario.update({
        where: { id: userId },
        data: { activo: false }
      });

      logger.info('Usuario desactivado:', { userId });
    } catch (error: any) {
      logger.error('Error desactivando usuario:', error, { userId });
      throw error;
    }
  }

  // Activar cuenta de usuario
  async activateUser(userId: string): Promise<void> {
    try {
      await prisma.usuario.update({
        where: { id: userId },
        data: { activo: true }
      });

      logger.info('Usuario activado:', { userId });
    } catch (error: any) {
      logger.error('Error activando usuario:', error, { userId });
      throw error;
    }
  }
  // Agregar imagen a galería de empresa
  async addGalleryImage(userId: string, imageUrl: string): Promise<CompanyProfile> {
    try {
      const company = await prisma.empresa.findUnique({
        where: { usuarioId: userId },
        include: { perfilEmpresa: true }
      });

      if (!company) {
        throw new Error('COMPANY_NOT_FOUND');
      }

      if (!company.perfilEmpresa) {
        throw new Error('COMPANY_PROFILE_NOT_FOUND');
      }

      const currentGallery = company.perfilEmpresa.galeria || [];

      const updatedCompany = await prisma.empresa.update({
        where: { usuarioId: userId },
        data: {
          perfilEmpresa: {
            update: {
              galeria: [...currentGallery, imageUrl]
            }
          }
        },
        include: {
          usuario: true,
          perfilEmpresa: true
        }
      });

      logger.info('Imagen agregada a galería:', { userId, imageUrl });
      return updatedCompany as any;
    } catch (error: any) {
      logger.error('Error agregando imagen a galería:', error);
      throw error;
    }
  }

  // Eliminar imagen de galería
  async removeGalleryImage(userId: string, imageUrl: string): Promise<CompanyProfile> {
    try {
      const company = await prisma.empresa.findUnique({
        where: { usuarioId: userId },
        include: { perfilEmpresa: true }
      });

      if (!company || !company.perfilEmpresa) {
        throw new Error('COMPANY_PROFILE_NOT_FOUND');
      }

      const currentGallery = company.perfilEmpresa.galeria || [];
      const newGallery = currentGallery.filter(url => url !== imageUrl);

      const updatedCompany = await prisma.empresa.update({
        where: { usuarioId: userId },
        data: {
          perfilEmpresa: {
            update: {
              galeria: newGallery
            }
          }
        },
        include: {
          usuario: true,
          perfilEmpresa: true
        }
      });

      logger.info('Imagen eliminada de galería:', { userId, imageUrl });
      return updatedCompany as any;
    } catch (error: any) {
      logger.error('Error eliminando imagen de galería:', error);
      throw error;
    }
  }

  // Agregar beneficio a empresa
  async addCompanyBenefit(userId: string, beneficioId: string, descripcion?: string): Promise<any> {
    try {
      const company = await prisma.empresa.findUnique({
        where: { usuarioId: userId },
        include: { perfilEmpresa: true }
      });

      if (!company || !company.perfilEmpresa) {
        throw new Error('COMPANY_PROFILE_NOT_FOUND');
      }

      const benefit = await prisma.beneficioEmpresa.create({
        data: {
          perfil_empresa_id: company.perfilEmpresa.id,
          beneficio_id: beneficioId,
          descripcion: descripcion || null
        },
        include: {
          beneficio: true
        }
      });

      logger.info('Beneficio agregado a empresa:', { userId, beneficioId });
      return benefit;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('BENEFIT_ALREADY_ADDED');
      }
      logger.error('Error agregando beneficio:', error);
      throw error;
    }
  }

  // Eliminar beneficio de empresa
  async removeCompanyBenefit(userId: string, benefitId: string): Promise<void> {
    try {
      const benefit = await prisma.beneficioEmpresa.findUnique({
        where: { id: benefitId },
        include: {
          perfil_empresa: {
            include: {
              empresa: true
            }
          }
        }
      });

      if (!benefit) {
        throw new Error('BENEFIT_NOT_FOUND');
      }

      if (benefit.perfil_empresa.empresa.usuarioId !== userId) {
        throw new Error('UNAUTHORIZED');
      }

      await prisma.beneficioEmpresa.delete({
        where: { id: benefitId }
      });

      logger.info('Beneficio eliminado:', { userId, benefitId });
    } catch (error: any) {
      logger.error('Error eliminando beneficio:', error);
      throw error;
    }
  }

  // Obtener beneficios de empresa
  async getCompanyBenefits(userId: string): Promise<any[]> {
    try {
      const company = await prisma.empresa.findUnique({
        where: { usuarioId: userId },
        include: {
          perfilEmpresa: {
            include: {
              beneficios: {
                include: {
                  beneficio: true
                }
              }
            }
          }
        }
      });

      if (!company || !company.perfilEmpresa) {
        return [];
      }

      return company.perfilEmpresa.beneficios;
    } catch (error: any) {
      logger.error('Error obteniendo beneficios de empresa:', error);
      throw error;
    }
  }
}

export default new UsersService();