import prisma from '../config/database';
import logger from '../utils/logger';
import {
  AdminUserListQuery,
  AdminUserStats,
  AdminUpdateUserDTO,
  AdminOfferQuery,
  AdminOfferStats,
  AdminOfferUpdateDTO,
  AdminPostQuery,
  AdminPostStats,
  AdminPostUpdateDTO,
  AdminDashboardStats
} from '../types/admin.types';
import { UserRole } from '../types/common.types';

class AdminService {
  async getAllUsers(query: AdminUserListQuery) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        rol,
        activo,
        verificado,
        perfilCompleto,
        fechaDesde,
        fechaHasta,
        orderBy = 'createdAt',
        order = 'desc'
      } = query;

      const skip = (page - 1) * limit;
      const where: any = {};

      if (search) {
        where.OR = [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (rol) where.rol = rol;
      if (activo !== undefined) where.activo = activo;
      if (verificado !== undefined) where.emailVerificado = verificado;
      if (perfilCompleto !== undefined) where.perfilCompleto = perfilCompleto;

      if (fechaDesde || fechaHasta) {
        where.createdAt = {};
        if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
        if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
      }

      const [usuarios, total] = await Promise.all([
        prisma.usuario.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: order },
          include: {
            estudiante: true,
            empresa: true,
            institucion: true,
            _count: {
              select: {
                seguidores: true,
                posts: true
              }
            }
          }
        }),
        prisma.usuario.count({ where })
      ]);

      return {
        data: usuarios,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error al obtener todos los usuarios (admin):', error);
      throw error;
    }
  }

  async getUserStats(): Promise<AdminUserStats> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);

      const mesAtras = new Date();
      mesAtras.setMonth(mesAtras.getMonth() - 1);

      const [
        total,
        porRol,
        activos,
        verificados,
        perfilCompleto,
        registrosHoy,
        registrosEstaSemana,
        registrosEsteMes
      ] = await Promise.all([
        prisma.usuario.count(),
        prisma.usuario.groupBy({
          by: ['rol'],
          _count: true
        }),
        prisma.usuario.count({ where: { activo: true } }),
        prisma.usuario.count({ where: { emailVerificado: true } }),
        prisma.usuario.count({ where: { perfilCompleto: true } }),
        prisma.usuario.count({ where: { createdAt: { gte: hoy } } }),
        prisma.usuario.count({ where: { createdAt: { gte: semanaAtras } } }),
        prisma.usuario.count({ where: { createdAt: { gte: mesAtras } } })
      ]);

      const rolCounts = {
        ESTUDIANTE: 0,
        EMPRESA: 0,
        INSTITUCION: 0,
        ADMIN: 0
      };

      porRol.forEach((item: any) => {
        rolCounts[item.rol as UserRole] = item._count;
      });

      return {
        total,
        porRol: rolCounts,
        activos,
        inactivos: total - activos,
        verificados,
        noVerificados: total - verificados,
        perfilCompleto,
        perfilIncompleto: total - perfilCompleto,
        registrosHoy,
        registrosEstaSemana,
        registrosEsteMes
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de usuarios:', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: AdminUpdateUserDTO) {
    try {
      const usuario = await prisma.usuario.update({
        where: { id: userId },
        data,
        include: {
          estudiante: true,
          empresa: true,
          institucion: true
        }
      });

      logger.info(`Usuario ${userId} actualizado por admin`);
      return usuario;
    } catch (error) {
      logger.error('Error al actualizar usuario (admin):', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      await prisma.usuario.delete({
        where: { id: userId }
      });

      logger.info(`Usuario ${userId} eliminado permanentemente por admin`);
      return { success: true };
    } catch (error) {
      logger.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  async verifyUserEmail(userId: string) {
    try {
      const usuario = await prisma.usuario.update({
        where: { id: userId },
        data: { emailVerificado: true }
      });

      logger.info(`Email verificado manualmente para usuario ${userId}`);
      return usuario;
    } catch (error) {
      logger.error('Error al verificar email:', error);
      throw error;
    }
  }

  async changeUserRole(userId: string, newRole: UserRole) {
    try {
      const usuario = await prisma.usuario.update({
        where: { id: userId },
        data: { rol: newRole }
      });

      logger.info(`Rol cambiado a ${newRole} para usuario ${userId}`);
      return usuario;
    } catch (error) {
      logger.error('Error al cambiar rol de usuario:', error);
      throw error;
    }
  }

  async getAllOffers(query: AdminOfferQuery) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        modalidad,
        estado,
        empresaId,
        verificada,
        destacada,
        fechaDesde,
        fechaHasta,
        orderBy = 'createdAt',
        order = 'desc'
      } = query;

      const skip = (page - 1) * limit;
      const where: any = {};

      if (search) {
        where.OR = [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (modalidad) where.modalidad = modalidad;
      if (estado) where.estado = estado;
      if (empresaId) where.empresaId = empresaId;
      if (verificada !== undefined) where.verificada = verificada;
      if (destacada !== undefined) where.destacada = destacada;

      if (fechaDesde || fechaHasta) {
        where.createdAt = {};
        if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
        if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
      }

      const [ofertas, total] = await Promise.all([
        prisma.oferta.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: order },
          include: {
            empresa: {
              select: {
                id: true,
                nombre_empresa: true,
                logo_url: true,
                verificada: true
              }
            },
            _count: {
              select: {
                postulaciones: true
              }
            }
          }
        }),
        prisma.oferta.count({ where })
      ]);

      return {
        data: ofertas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error al obtener todas las ofertas (admin):', error);
      throw error;
    }
  }

  async getOfferStats(): Promise<AdminOfferStats> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);

      const mesAtras = new Date();
      mesAtras.setMonth(mesAtras.getMonth() - 1);

      const [
        total,
        porEstado,
        porModalidad,
        verificadas,
        destacadas,
        publicadasHoy,
        publicadasEstaSemana,
        publicadasEsteMes,
        postulaciones
      ] = await Promise.all([
        prisma.oferta.count(),
        prisma.oferta.groupBy({
          by: ['estado'],
          _count: true
        }),
        prisma.oferta.groupBy({
          by: ['modalidad'],
          _count: true
        }),
        prisma.oferta.count({ where: { verificada: true } }),
        prisma.oferta.count({ where: { destacada: true } }),
        prisma.oferta.count({ where: { createdAt: { gte: hoy } } }),
        prisma.oferta.count({ where: { createdAt: { gte: semanaAtras } } }),
        prisma.oferta.count({ where: { createdAt: { gte: mesAtras } } }),
        prisma.postulacion.count()
      ]);

      const estadoCounts: any = {
        ACTIVA: 0,
        CERRADA: 0,
        BORRADOR: 0,
        PUBLICADA: 0
      };

      porEstado.forEach((item: any) => {
        if (estadoCounts.hasOwnProperty(item.estado)) {
          estadoCounts[item.estado] = item._count;
        }
      });

      const modalidadCounts: any = {};
      porModalidad.forEach((item: any) => {
        modalidadCounts[item.modalidad] = item._count;
      });

      return {
        total,
        activas: estadoCounts.ACTIVA,
        cerradas: estadoCounts.CERRADA,
        borradores: estadoCounts.BORRADOR,
        verificadas,
        noVerificadas: total - verificadas,
        destacadas,
        porModalidad: modalidadCounts,
        publicadasHoy,
        publicadasEstaSemana,
        publicadasEsteMes,
        totalPostulaciones: postulaciones,
        promedioPostulacionesPorOferta: total > 0 ? postulaciones / total : 0
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de ofertas:', error);
      throw error;
    }
  }

  async updateOffer(offerId: string, data: AdminOfferUpdateDTO) {
    try {
      const oferta = await prisma.oferta.update({
        where: { id: offerId },
        data: data as any,
        include: {
          empresa: {
            select: {
              nombre_empresa: true
            }
          }
        }
      });

      logger.info(`Oferta ${offerId} actualizada por admin`);
      return oferta;
    } catch (error) {
      logger.error('Error al actualizar oferta (admin):', error);
      throw error;
    }
  }

  async deleteOffer(offerId: string) {
    try {
      await prisma.oferta.delete({
        where: { id: offerId }
      });

      logger.info(`Oferta ${offerId} eliminada permanentemente por admin`);
      return { success: true };
    } catch (error) {
      logger.error('Error al eliminar oferta:', error);
      throw error;
    }
  }

  async approveOffer(offerId: string) {
    try {
      const oferta = await prisma.oferta.update({
        where: { id: offerId },
        data: {
          verificada: true,
          estado: 'PUBLICADA' as any
        }
      });

      logger.info(`Oferta ${offerId} aprobada por admin`);
      return oferta;
    } catch (error) {
      logger.error('Error al aprobar oferta:', error);
      throw error;
    }
  }

  async rejectOffer(offerId: string, razon?: string) {
    try {
      const oferta = await prisma.oferta.update({
        where: { id: offerId },
        data: {
          verificada: false,
          estado: 'CERRADA'
        }
      });

      logger.info(`Oferta ${offerId} rechazada por admin. Razón: ${razon || 'No especificada'}`);
      return oferta;
    } catch (error) {
      logger.error('Error al rechazar oferta:', error);
      throw error;
    }
  }

  async getAllPosts(query: AdminPostQuery) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        autorId,
        reportado,
        oculto,
        fechaDesde,
        fechaHasta,
        orderBy = 'createdAt',
        order = 'desc'
      } = query;

      const skip = (page - 1) * limit;
      const where: any = {};

      if (search) {
        where.contenido = { contains: search, mode: 'insensitive' };
      }

      if (autorId) where.autorId = autorId;
      if (reportado !== undefined) where.reportado = reportado;
      if (oculto !== undefined) where.oculto = oculto;

      if (fechaDesde || fechaHasta) {
        where.createdAt = {};
        if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
        if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: order },
          include: {
            autor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                avatar: true,
                rol: true
              }
            },
            _count: {
              select: {
                reacciones: true,
                comentarios: true
              }
            }
          }
        }),
        prisma.post.count({ where })
      ]);

      return {
        data: posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error al obtener todos los posts (admin):', error);
      throw error;
    }
  }

  async getPostStats(): Promise<AdminPostStats> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);

      const mesAtras = new Date();
      mesAtras.setMonth(mesAtras.getMonth() - 1);

      const [
        total,
        ocultos,
        reportados,
        conMedia,
        totalReacciones,
        totalComentarios,
        postsHoy,
        postsEstaSemana,
        postsEsteMes
      ] = await Promise.all([
        prisma.post.count(),
        prisma.post.count({ where: { oculto: true } }),
        prisma.post.count({ where: { reportado: true } }),
        prisma.post.count({ where: { imagenes: { isEmpty: false } } }),
        prisma.reaccion.count({ where: { postId: { not: null } } }),
        prisma.comentario.count(),
        prisma.post.count({ where: { createdAt: { gte: hoy } } }),
        prisma.post.count({ where: { createdAt: { gte: semanaAtras } } }),
        prisma.post.count({ where: { createdAt: { gte: mesAtras } } })
      ]);

      return {
        total,
        publicados: total - ocultos,
        ocultos,
        reportados,
        conMedia,
        totalReacciones,
        totalComentarios,
        postsHoy,
        postsEstaSemana,
        postsEsteMes
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de posts:', error);
      throw error;
    }
  }

  async hidePost(postId: string, razon?: string) {
    try {
      const post = await prisma.post.update({
        where: { id: postId },
        data: { oculto: true }
      });

      logger.info(`Post ${postId} ocultado por admin. Razón: ${razon || 'No especificada'}`);
      return post;
    } catch (error) {
      logger.error('Error al ocultar post:', error);
      throw error;
    }
  }

  async unhidePost(postId: string) {
    try {
      const post = await prisma.post.update({
        where: { id: postId },
        data: { oculto: false }
      });

      logger.info(`Post ${postId} visible nuevamente (admin)`);
      return post;
    } catch (error) {
      logger.error('Error al mostrar post:', error);
      throw error;
    }
  }

  async deletePost(postId: string) {
    try {
      await prisma.post.delete({
        where: { id: postId }
      });

      logger.info(`Post ${postId} eliminado permanentemente por admin`);
      return { success: true };
    } catch (error) {
      logger.error('Error al eliminar post:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string) {
    try {
      await prisma.comentario.delete({
        where: { id: commentId }
      });

      logger.info(`Comentario ${commentId} eliminado por admin`);
      return { success: true };
    } catch (error) {
      logger.error('Error al eliminar comentario:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);

      const [
        totalUsuarios,
        nuevosUsuariosHoy,
        nuevosUsuariosEstaSemana,
        usuariosActivos,
        totalOfertas,
        ofertasActivas,
        nuevasOfertasHoy,
        totalPostulaciones,
        totalPosts,
        nuevosPostsHoy,
        totalReacciones,
        totalComentarios
      ] = await Promise.all([
        prisma.usuario.count(),
        prisma.usuario.count({ where: { createdAt: { gte: hoy } } }),
        prisma.usuario.count({ where: { createdAt: { gte: semanaAtras } } }),
        prisma.usuario.count({ where: { activo: true } }),
        prisma.oferta.count(),
        prisma.oferta.count({ where: { estado: 'PUBLICADA' as any } }),
        prisma.oferta.count({ where: { createdAt: { gte: hoy } } }),
        prisma.postulacion.count(),
        prisma.post.count(),
        prisma.post.count({ where: { createdAt: { gte: hoy } } }),
        prisma.reaccion.count(),
        prisma.comentario.count()
      ]);

      return {
        usuarios: {
          total: totalUsuarios,
          nuevosHoy: nuevosUsuariosHoy,
          nuevosEstaSemana: nuevosUsuariosEstaSemana,
          activos: usuariosActivos
        },
        ofertas: {
          total: totalOfertas,
          activas: ofertasActivas,
          nuevasHoy: nuevasOfertasHoy,
          totalPostulaciones
        },
        contenido: {
          totalPosts,
          nuevosPostsHoy,
          totalReacciones,
          totalComentarios
        },
        reportes: {
          pendientes: 0,
          urgentes: 0,
          totalResueltos: 0
        },
        actividad: {
          usuariosActivos24h: 0,
          usuariosActivos7d: 0,
          tasaRetencion: 0
        }
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas del dashboard:', error);
      throw error;
    }
  }
}

export default new AdminService();