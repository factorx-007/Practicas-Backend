import { Response } from 'express';
import { AuthenticatedRequest } from '../types/common.types';
import adminService from '../services/admin.service';
import { ApiResponseHandler } from '../utils/responses';
import logger from '../utils/logger';
import {
  AdminUserListQuery,
  AdminUpdateUserDTO,
  AdminOfferQuery,
  AdminOfferUpdateDTO,
  AdminPostQuery
} from '../types/admin.types';
import { UserRole } from '../types/common.types';

class AdminController {
  async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const query: AdminUserListQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        rol: req.query.rol as UserRole,
        activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined,
        verificado: req.query.verificado === 'true' ? true : req.query.verificado === 'false' ? false : undefined,
        perfilCompleto: req.query.perfilCompleto === 'true' ? true : req.query.perfilCompleto === 'false' ? false : undefined,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        orderBy: req.query.orderBy as any,
        order: req.query.order as any
      };

      const result = await adminService.getAllUsers(query);
      return ApiResponseHandler.success(res, result, 'Usuarios obtenidos exitosamente');
    } catch (error) {
      logger.error('Error al obtener usuarios (admin):', error);
      return ApiResponseHandler.error(res, 'Error al obtener usuarios');
    }
  }

  async getUserStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await adminService.getUserStats();
      return ApiResponseHandler.success(res, stats, 'Estadísticas de usuarios obtenidas');
    } catch (error) {
      logger.error('Error al obtener estadísticas de usuarios:', error);
      return ApiResponseHandler.error(res, 'Error al obtener estadísticas');
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const data: AdminUpdateUserDTO = req.body;

      const usuario = await adminService.updateUser(userId, data);
      return ApiResponseHandler.success(res, usuario, 'Usuario actualizado exitosamente');
    } catch (error: any) {
      logger.error('Error al actualizar usuario:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Usuario no encontrado');
      }
      return ApiResponseHandler.error(res, 'Error al actualizar usuario');
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      await adminService.deleteUser(userId);
      return ApiResponseHandler.success(res, null, 'Usuario eliminado permanentemente');
    } catch (error: any) {
      logger.error('Error al eliminar usuario:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Usuario no encontrado');
      }
      return ApiResponseHandler.error(res, 'Error al eliminar usuario');
    }
  }

  async verifyUserEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      const usuario = await adminService.verifyUserEmail(userId);
      return ApiResponseHandler.success(res, usuario, 'Email verificado exitosamente');
    } catch (error: any) {
      logger.error('Error al verificar email:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Usuario no encontrado');
      }
      return ApiResponseHandler.error(res, 'Error al verificar email');
    }
  }

  async changeUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { rol } = req.body;

      if (!Object.values(UserRole).includes(rol)) {
        return ApiResponseHandler.error(res, 'Rol inválido', 400);
      }

      const usuario = await adminService.changeUserRole(userId, rol);
      return ApiResponseHandler.success(res, usuario, 'Rol actualizado exitosamente');
    } catch (error: any) {
      logger.error('Error al cambiar rol:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Usuario no encontrado');
      }
      return ApiResponseHandler.error(res, 'Error al cambiar rol');
    }
  }

  async getAllOffers(req: AuthenticatedRequest, res: Response) {
    try {
      const query: AdminOfferQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        modalidad: req.query.modalidad as any,
        estado: req.query.estado as any,
        empresaId: req.query.empresaId as string,
        verificada: req.query.verificada === 'true' ? true : req.query.verificada === 'false' ? false : undefined,
        destacada: req.query.destacada === 'true' ? true : req.query.destacada === 'false' ? false : undefined,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        orderBy: req.query.orderBy as any,
        order: req.query.order as any
      };

      const result = await adminService.getAllOffers(query);
      return ApiResponseHandler.success(res, result, 'Ofertas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error al obtener ofertas (admin):', error);
      return ApiResponseHandler.error(res, 'Error al obtener ofertas');
    }
  }

  async getOfferStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await adminService.getOfferStats();
      return ApiResponseHandler.success(res, stats, 'Estadísticas de ofertas obtenidas');
    } catch (error) {
      logger.error('Error al obtener estadísticas de ofertas:', error);
      return ApiResponseHandler.error(res, 'Error al obtener estadísticas');
    }
  }

  async updateOffer(req: AuthenticatedRequest, res: Response) {
    try {
      const { offerId } = req.params;
      const data: AdminOfferUpdateDTO = req.body;

      const oferta = await adminService.updateOffer(offerId, data);
      return ApiResponseHandler.success(res, oferta, 'Oferta actualizada exitosamente');
    } catch (error: any) {
      logger.error('Error al actualizar oferta:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }
      return ApiResponseHandler.error(res, 'Error al actualizar oferta');
    }
  }

  async deleteOffer(req: AuthenticatedRequest, res: Response) {
    try {
      const { offerId } = req.params;

      await adminService.deleteOffer(offerId);
      return ApiResponseHandler.success(res, null, 'Oferta eliminada permanentemente');
    } catch (error: any) {
      logger.error('Error al eliminar oferta:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }
      return ApiResponseHandler.error(res, 'Error al eliminar oferta');
    }
  }

  async approveOffer(req: AuthenticatedRequest, res: Response) {
    try {
      const { offerId } = req.params;

      const oferta = await adminService.approveOffer(offerId);
      return ApiResponseHandler.success(res, oferta, 'Oferta aprobada y activada');
    } catch (error: any) {
      logger.error('Error al aprobar oferta:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }
      return ApiResponseHandler.error(res, 'Error al aprobar oferta');
    }
  }

  async rejectOffer(req: AuthenticatedRequest, res: Response) {
    try {
      const { offerId } = req.params;
      const { razon } = req.body;

      const oferta = await adminService.rejectOffer(offerId, razon);
      return ApiResponseHandler.success(res, oferta, 'Oferta rechazada');
    } catch (error: any) {
      logger.error('Error al rechazar oferta:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }
      return ApiResponseHandler.error(res, 'Error al rechazar oferta');
    }
  }

  async getAllPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const query: AdminPostQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        autorId: req.query.autorId as string,
        reportado: req.query.reportado === 'true' ? true : req.query.reportado === 'false' ? false : undefined,
        oculto: req.query.oculto === 'true' ? true : req.query.oculto === 'false' ? false : undefined,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        orderBy: req.query.orderBy as any,
        order: req.query.order as any
      };

      const result = await adminService.getAllPosts(query);
      return ApiResponseHandler.success(res, result, 'Posts obtenidos exitosamente');
    } catch (error) {
      logger.error('Error al obtener posts (admin):', error);
      return ApiResponseHandler.error(res, 'Error al obtener posts');
    }
  }

  async getPostStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await adminService.getPostStats();
      return ApiResponseHandler.success(res, stats, 'Estadísticas de posts obtenidas');
    } catch (error) {
      logger.error('Error al obtener estadísticas de posts:', error);
      return ApiResponseHandler.error(res, 'Error al obtener estadísticas');
    }
  }

  async hidePost(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const { razon } = req.body;

      const post = await adminService.hidePost(postId, razon);
      return ApiResponseHandler.success(res, post, 'Post ocultado exitosamente');
    } catch (error: any) {
      logger.error('Error al ocultar post:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Post no encontrado');
      }
      return ApiResponseHandler.error(res, 'Error al ocultar post');
    }
  }

  async unhidePost(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;

      const post = await adminService.unhidePost(postId);
      return ApiResponseHandler.success(res, post, 'Post visible nuevamente');
    } catch (error: any) {
      logger.error('Error al mostrar post:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Post no encontrado');
      }
      return ApiResponseHandler.error(res, 'Error al mostrar post');
    }
  }

  async deletePost(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;

      await adminService.deletePost(postId);
      return ApiResponseHandler.success(res, null, 'Post eliminado permanentemente');
    } catch (error: any) {
      logger.error('Error al eliminar post:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Post no encontrado');
      }
      return ApiResponseHandler.error(res, 'Error al eliminar post');
    }
  }

  async deleteComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.params;

      await adminService.deleteComment(commentId);
      return ApiResponseHandler.success(res, null, 'Comentario eliminado exitosamente');
    } catch (error: any) {
      logger.error('Error al eliminar comentario:', error);
      if (error.code === 'P2025') {
        return ApiResponseHandler.notFound(res, 'Comentario no encontrado');
      }
      return ApiResponseHandler.error(res, 'Error al eliminar comentario');
    }
  }

  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      return ApiResponseHandler.success(res, stats, 'Dashboard obtenido exitosamente');
    } catch (error) {
      logger.error('Error al obtener dashboard:', error);
      return ApiResponseHandler.error(res, 'Error al obtener dashboard');
    }
  }
}

export default new AdminController();