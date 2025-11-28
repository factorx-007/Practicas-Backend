import prisma from '../config/database';
import logger from '../utils/logger';
import { OfferSearchFilters, PaginatedResponse } from '../types/common.types';
import { getNotificationsSocketInstance } from '../socket/notifications.socket';
import { 
  CreateOfferData, 
  UpdateOfferData, 
  OfferWithDetails,
  ApplicationWithDetails 
} from '../types/offers.types';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '../types/common.types';

const notificationsService = new NotificationsService();

export class OffersService {
  async createOffer(userId: string, offerData: CreateOfferData): Promise<any> {
    try {
      const company = await prisma.empresa.findUnique({
        where: { usuarioId: userId }
      });

      if (!company) {
        throw new Error('COMPANY_PROFILE_NOT_FOUND');
      }

      const offer = await prisma.oferta.create({
        data: {
          titulo: offerData.titulo,
          descripcion: offerData.descripcion,
          ubicacion: offerData.ubicacion,
          modalidad: offerData.modalidad as any,
          salario_min: offerData.salarioMin,
          salario_max: offerData.salarioMax,
          fecha_limite: offerData.fechaLimite,
          empresaId: company.id,
          estado: 'PUBLICADA' as any
        },
        include: {
          empresa: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          postulaciones: {
            include: {
              estudiante: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true,
                      email: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: { postulaciones: true }
          }
        }
      });

      logger.info(`Oferta creada: ${offer.id} por empresa ${company.id}`);
      return offer;
    } catch (error) {
      logger.error('Error creando oferta:', error);
      throw error;
    }
  }

  async getOfferById(offerId: string): Promise<any> {
    try {
      const offer = await prisma.oferta.findUnique({
        where: { id: offerId },
        include: {
          empresa: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          postulaciones: {
            include: {
              estudiante: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true,
                      email: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: { postulaciones: true }
          }
        }
      });

      return offer;
    } catch (error) {
      logger.error('Error obteniendo oferta:', error);
      throw error;
    }
  }

  async updateOffer(offerId: string, userId: string, updateData: any): Promise<any> {
    try {
      const offer = await prisma.oferta.findUnique({
        where: { id: offerId },
        include: { empresa: true }
      });

      if (!offer) {
        throw new Error('OFFER_NOT_FOUND');
      }

      if (offer.empresa.usuarioId !== userId) {
        throw new Error('UNAUTHORIZED_OFFER_UPDATE');
      }

      const updatedOffer = await prisma.oferta.update({
        where: { id: offerId },
        data: updateData,
        include: {
          empresa: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          postulaciones: {
            include: {
              estudiante: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true,
                      email: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: { postulaciones: true }
          }
        }
      });

      logger.info(`Oferta actualizada: ${offerId}`);
      return updatedOffer;
    } catch (error) {
      logger.error('Error actualizando oferta:', error);
      throw error;
    }
  }

  async deleteOffer(offerId: string, userId: string): Promise<void> {
    try {
      const offer = await prisma.oferta.findUnique({
        where: { id: offerId },
        include: { empresa: true }
      });

      if (!offer) {
        throw new Error('OFFER_NOT_FOUND');
      }

      if (offer.empresa.usuarioId !== userId) {
        throw new Error('UNAUTHORIZED_OFFER_DELETE');
      }

      await prisma.oferta.update({
        where: { id: offerId },
        data: { estado: 'CERRADA' as any }
      });

      logger.info(`Oferta eliminada: ${offerId}`);
    } catch (error) {
      logger.error('Error eliminando oferta:', error);
      throw error;
    }
  }

  async searchOffers(
    filters: OfferSearchFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        estado: 'PUBLICADA'
      };

      if (filters.search) {
        whereClause.OR = [
          { titulo: { contains: filters.search, mode: 'insensitive' } },
          { descripcion: { contains: filters.search, mode: 'insensitive' } },
          { ubicacion: { contains: filters.search, mode: 'insensitive' } },
          { empresa: { nombre_empresa: { contains: filters.search, mode: 'insensitive' } } }
        ];
      }

      if (filters.modalidad) {
        whereClause.modalidad = filters.modalidad;
      }

      if (filters.experiencia) {
        whereClause.experiencia = filters.experiencia;
      }

      if (filters.salarioMin || filters.salarioMax) {
        whereClause.salario = {};
        if (filters.salarioMin) {
          whereClause.salario.gte = filters.salarioMin;
        }
        if (filters.salarioMax) {
          whereClause.salario.lte = filters.salarioMax;
        }
      }

      if (filters.ubicacion) {
        whereClause.ubicacion = { contains: filters.ubicacion, mode: 'insensitive' };
      }

      if (filters.empresaId) {
        whereClause.empresaId = filters.empresaId;
      }

      const [offers, totalCount] = await Promise.all([
        prisma.oferta.findMany({
          where: whereClause,
          include: {
            empresa: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            },
            _count: {
              select: { postulaciones: true }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.oferta.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: offers.map(offer => ({
          ...offer,
          fechaLimite: offer.fecha_limite ? new Date(offer.fecha_limite).toLocaleDateString('es-ES') : null,
          rangoSalarial: `${offer.salario_min} - ${offer.salario_max}`,
          tipoEmpleo: offer.tipoEmpleo,
          nivelEducacion: offer.nivelEducacion,
          experiencia: offer.experiencia
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error buscando ofertas:', error);
      throw error;
    }
  }

  async applyToOffer(offerId: string, userId: string, cvUrl?: string): Promise<any> {
    try {
      const student = await prisma.estudiante.findUnique({
        where: { usuarioId: userId },
        include: { usuario: true }
      });

      if (!student) {
        throw new Error('STUDENT_PROFILE_NOT_FOUND');
      }

      const offer = await prisma.oferta.findUnique({
        where: { id: offerId },
        include: { empresa: true }
      });

      if (!offer) {
        throw new Error('OFFER_NOT_FOUND');
      }

      const existingApplication = await prisma.postulacion.findUnique({
        where: {
          estudianteId_ofertaId: {
            estudianteId: student.id,
            ofertaId: offerId
          }
        }
      });

      if (existingApplication) {
        throw new Error('ALREADY_APPLIED');
      }

      const postulation = await prisma.postulacion.create({
        data: {
          estudianteId: student.id,
          ofertaId: offerId,
          createdAt: new Date(),
          estado: 'EN_REVISION' as any,
          cv_url: cvUrl
        },
        include: {
          estudiante: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          oferta: {
            include: {
              empresa: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true,
                      email: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Crear notificación para la empresa
      if (offer) {
        const notificationsSocket = getNotificationsSocketInstance();
        if (notificationsSocket) {
          await notificationsSocket.createAndSendNotification({
            titulo: 'Nueva postulación',
            mensaje: `${student.usuario.nombre} ${student.usuario.apellido} se ha postulado a tu oferta "${offer.titulo}"`,
            tipo: NotificationType.POSTULACION,
            destinatarioId: offer.empresa.usuarioId,
            remitenteId: userId,
            metadata: {
              ofertaId: offer.id,
              postulacionId: postulation.id
            }
          });
        }
      }

      logger.info(`Postulación creada: estudiante ${student.id} -> oferta ${offerId}`);
      return postulation;
    } catch (error) {
      logger.error('Error postulando a oferta:', error);
      throw error;
    }
  }

  async getMyApplications(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    try {
      const student = await prisma.estudiante.findUnique({
        where: { usuarioId: userId }
      });

      if (!student) {
        throw new Error('STUDENT_PROFILE_NOT_FOUND');
      }

      const skip = (page - 1) * limit;

      const [applications, totalCount] = await Promise.all([
        prisma.postulacion.findMany({
          where: { estudianteId: student.id },
          include: {
            oferta: {
              include: {
                empresa: {
                  include: {
                    usuario: {
                      select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        email: true,
                        avatar: true
                      }
                    }
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.postulacion.count({ where: { estudianteId: student.id } })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: applications,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error obteniendo postulaciones del estudiante:', error);
      throw error;
    }
  }

  async getOfferApplications(offerId: string, userId: string, page: number = 1, limit: number = 10): Promise<any> {
    try {
      const offer = await prisma.oferta.findUnique({
        where: { id: offerId },
        include: { empresa: true }
      });

      if (!offer) {
        throw new Error('OFFER_NOT_FOUND');
      }

      if (offer.empresa.usuarioId !== userId) {
        throw new Error('UNAUTHORIZED_VIEW_APPLICATIONS');
      }

      const skip = (page - 1) * limit;

      const [applications, totalCount] = await Promise.all([
        prisma.postulacion.findMany({
          where: { ofertaId: offerId },
          include: {
            estudiante: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.postulacion.count({ where: { ofertaId: offerId } })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: applications,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error obteniendo postulaciones de la oferta:', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId: string, userId: string, status: string): Promise<any> {
    try {
      const application = await prisma.postulacion.findUnique({
        where: { id: applicationId },
        include: {
          oferta: {
            include: { empresa: true }
          }
        }
      });

      if (!application) {
        throw new Error('APPLICATION_NOT_FOUND');
      }

      if (application.oferta.empresa.usuarioId !== userId) {
        throw new Error('UNAUTHORIZED_UPDATE_APPLICATION');
      }

      const validStatuses = ['EN_REVISION', 'ACEPTADO', 'RECHAZADO'];
      if (!validStatuses.includes(status)) {
        throw new Error('INVALID_STATUS');
      }

      const updatedApplication = await prisma.postulacion.update({
        where: { id: applicationId },
        data: { estado: status as any },
        include: {
          estudiante: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          oferta: {
            include: {
              empresa: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true,
                      email: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Crear notificación para el estudiante
      await notificationsService.createNotification({
        titulo: 'Actualización de tu postulación',
        mensaje: `El estado de tu postulación para la oferta "${updatedApplication.oferta.titulo}" ha sido actualizado a ${status}`,
        tipo: NotificationType.POSTULACION,
        destinatarioId: updatedApplication.estudiante.usuarioId,
        remitenteId: userId,
        metadata: {
          ofertaId: updatedApplication.ofertaId,
          postulacionId: updatedApplication.id
        }
      });

      logger.info(`Estado de postulación actualizado: ${applicationId} -> ${status}`);
      return updatedApplication;
    } catch (error) {
      logger.error('Error actualizando estado de postulación:', error);
      throw error;
    }
  }

  async getMyOffers(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    try {
      const company = await prisma.empresa.findUnique({
        where: { usuarioId: userId }
      });

      if (!company) {
        throw new Error('COMPANY_PROFILE_NOT_FOUND');
      }

      const skip = (page - 1) * limit;

      const [offers, totalCount] = await Promise.all([
        prisma.oferta.findMany({
          where: { empresaId: company.id },
          include: {
            empresa: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            },
            _count: {
              select: { postulaciones: true }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.oferta.count({ where: { empresaId: company.id } })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: offers.map(offer => ({
          ...offer,
          numeroVistas: offer.vistas,
          numeroPostulaciones: offer._count.postulaciones,
          fechaCreacion: offer.createdAt,
          estado: offer.estado === 'PUBLICADA' ? 'ACTIVA' : offer.estado,
          mostrarSalario: offer.salario_min !== null && offer.salario_max !== null,
          tipoEmpleo: offer.tipoEmpleo || 'TIEMPO_COMPLETO',
          empresa: {
            id: offer.empresa.id,
            nombre: offer.empresa.nombre_empresa,
            logo: offer.empresa.logo_url,
            ubicacion: offer.empresa.direccion
          }
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error obteniendo ofertas de la empresa:', error);
      throw error;
    }
  }

  async incrementOfferViews(offerId: string): Promise<void> {
    try {
      await prisma.oferta.update({
        where: { id: offerId },
        data: {
          vistas: {
            increment: 1
          }
        }
      });

      logger.debug(`Vista incrementada para oferta: ${offerId}`);
    } catch (error) {
      logger.error('Error incrementando vistas de oferta:', error);
      // No lanzamos error para que no falle la petición principal
    }
  }

  async getStudentApplications(
    userId: string, 
    page: number = 1, 
    limit: number = 10, 
    status?: string
  ): Promise<any> {
    try {
      const student = await prisma.estudiante.findUnique({
        where: { usuarioId: userId }
      });

      if (!student) {
        throw new Error('STUDENT_PROFILE_NOT_FOUND');
      }

      const skip = (page - 1) * limit;

      const where: any = { estudianteId: student.id };
      if (status) {
        where.estado = status;
      }

      const [applications, totalCount] = await Promise.all([
        prisma.postulacion.findMany({
          where,
          include: {
            oferta: {
              include: {
                empresa: {
                  include: {
                    usuario: {
                      select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        email: true,
                        avatar: true
                      }
                    }
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.postulacion.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: applications.map(app => ({
          id: app.id,
          titulo: app.oferta.titulo,
          descripcion: app.oferta.descripcion,
          empresa: {
            nombre_empresa: app.oferta.empresa.usuario.nombre + ' ' + app.oferta.empresa.usuario.apellido,
            logo_url: app.oferta.empresa.usuario.avatar
          },
          fechaPostulacion: app.createdAt,
          estado: app.estado,
          cv_url: app.cv_url,
          mensaje: app.mensaje,
          oferta: {
            ubicacion: app.oferta.ubicacion,
            modalidad: app.oferta.modalidad
          }
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error obteniendo postulaciones del estudiante:', error);
      throw error;
    }
  }
}

export default new OffersService();