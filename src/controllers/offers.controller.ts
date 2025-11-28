import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { OffersService } from '../services/offers.service';
import { ApiResponseHandler } from '../utils/responses';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/common.types';

export class OffersController {
  private offersService: OffersService;

  constructor() {
    this.offersService = new OffersService();
  }

  // Crear nueva oferta de trabajo
  async createOffer(req: any, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const offer = await this.offersService.createOffer(req.user.id, req.body as any);

      logger.info('Oferta creada exitosamente', { 
        offerId: offer.id, 
        userId: req.user.id,
        title: offer.titulo 
      });

      ApiResponseHandler.created(res, offer, 'Oferta creada exitosamente');
    } catch (error: any) {
      logger.error('Error creando oferta:', error);
      
      if (error.message === 'COMPANY_PROFILE_NOT_FOUND') {
        return ApiResponseHandler.error(res, 'Perfil de empresa no encontrado');
      }

      next(error);
    }
  }

  // Obtener oferta por ID
  async getOfferById(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const offer = await this.offersService.getOfferById(id);

      if (!offer) {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }

      // Incrementar contador de vistas
      await this.offersService.incrementOfferViews(id);

      ApiResponseHandler.success(res, offer, 'Oferta obtenida exitosamente');
    } catch (error) {
      logger.error('Error obteniendo oferta:', error);
      next(error);
    }
  }

  // Actualizar oferta
  async updateOffer(req: any, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { id } = req.params;
      const updatedOffer = await this.offersService.updateOffer(id, req.user.id, req.body);

      logger.info('Oferta actualizada exitosamente', { 
        offerId: id, 
        userId: req.user.id 
      });

      ApiResponseHandler.success(res, updatedOffer, 'Oferta actualizada exitosamente');
    } catch (error: any) {
      logger.error('Error actualizando oferta:', error);
      
      if (error.message === 'OFFER_NOT_FOUND') {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }
      
      if (error.message === 'UNAUTHORIZED_OFFER_UPDATE') {
        return ApiResponseHandler.forbidden(res, 'No tienes permisos para actualizar esta oferta');
      }

      next(error);
    }
  }

  // Eliminar oferta (soft delete)
  async deleteOffer(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { id } = req.params;
      await this.offersService.deleteOffer(id, req.user.id);

      logger.info('Oferta eliminada exitosamente', { 
        offerId: id, 
        userId: req.user.id 
      });

      ApiResponseHandler.success(res, null, 'Oferta eliminada exitosamente');
    } catch (error: any) {
      logger.error('Error eliminando oferta:', error);
      
      if (error.message === 'OFFER_NOT_FOUND') {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }
      
      if (error.message === 'UNAUTHORIZED_OFFER_DELETE') {
        return ApiResponseHandler.forbidden(res, 'No tienes permisos para eliminar esta oferta');
      }

      next(error);
    }
  }

  // Buscar ofertas con filtros
  async searchOffers(req: any, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        search: req.query.search as string,
        ubicacion: req.query.ubicacion as string,
        modalidad: req.query.modalidad as string,
        tipoEmpleo: req.query.tipoEmpleo as string,
        nivelEducacion: req.query.nivelEducacion as string,
        experiencia: req.query.experiencia as string,
        salarioMin: req.query.salarioMin ? parseInt(req.query.salarioMin as string) : undefined,
        salarioMax: req.query.salarioMax ? parseInt(req.query.salarioMax as string) : undefined,
        empresaId: req.query.empresaId as string,
        createdFrom: req.query.createdFrom as string,
        createdTo: req.query.createdTo as string
      };

      const result = await this.offersService.searchOffers(filters, page, limit);

      ApiResponseHandler.success(res, result, 'Ofertas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error buscando ofertas:', error);
      next(error);
    }
  }

  // Aplicar a una oferta
  async applyToOffer(req: any, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { id } = req.params;
      const { mensaje, cvUrl } = req.body;

      const application = await this.offersService.applyToOffer(
        id, 
        req.user.id, 
        cvUrl
      );

      logger.info('Postulación creada exitosamente', { 
        offerId: id, 
        userId: req.user.id,
        applicationId: application.id 
      });

      ApiResponseHandler.created(res, application, 'Postulación enviada exitosamente');
    } catch (error: any) {
      logger.error('Error aplicando a oferta:', error);
      
      if (error.message === 'STUDENT_PROFILE_NOT_FOUND') {
        return ApiResponseHandler.error(res, 'Perfil de estudiante no encontrado');
      }
      
      if (error.message === 'OFFER_NOT_FOUND') {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }
      
      if (error.message === 'ALREADY_APPLIED') {
        return ApiResponseHandler.conflict(res, 'Ya has aplicado a esta oferta');
      }

      next(error);
    }
  }

  // Obtener postulaciones de una oferta (solo para empresas)
  async getOfferApplications(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      // TODO: Implementar getOfferApplications
      const result = { data: [], pagination: { currentPage: page, totalItems: 0, totalPages: 0, itemsPerPage: limit, hasNextPage: false, hasPrevPage: false } };

      ApiResponseHandler.success(res, result, 'Postulaciones obtenidas exitosamente');
    } catch (error: any) {
      logger.error('Error obteniendo postulaciones:', error);
      
      if (error.message === 'OFFER_NOT_FOUND') {
        return ApiResponseHandler.notFound(res, 'Oferta no encontrada');
      }
      
      if (error.message === 'UNAUTHORIZED_ACCESS') {
        return ApiResponseHandler.forbidden(res, 'No tienes permisos para ver estas postulaciones');
      }

      next(error);
    }
  }

  // Obtener postulaciones de un estudiante
  async getStudentApplications(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.estado as string;

      const result = await this.offersService.getStudentApplications(
        req.user.id, 
        page, 
        limit,
        status
      );

      ApiResponseHandler.success(res, result, 'Tus postulaciones obtenidas exitosamente');
    } catch (error: any) {
      logger.error('Error obteniendo postulaciones del estudiante:', error);
      
      if (error.message === 'STUDENT_PROFILE_NOT_FOUND') {
        return ApiResponseHandler.error(res, 'Perfil de estudiante no encontrado');
      }

      next(error);
    }
  }

  // Actualizar estado de postulación
  async updateApplicationStatus(req: any, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array());
      }

      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { applicationId } = req.params;
      const { status, notasEntrevistador } = req.body;

      const updatedApplication = await this.offersService.updateApplicationStatus(
        applicationId, 
        req.user.id, 
        status
      );

      logger.info('Estado de postulación actualizado', { 
        applicationId, 
        newStatus: status, 
        userId: req.user.id 
      });

      ApiResponseHandler.success(res, updatedApplication, 'Estado de postulación actualizado exitosamente');
    } catch (error: any) {
      logger.error('Error actualizando estado de postulación:', error);
      
      if (error.message === 'APPLICATION_NOT_FOUND') {
        return ApiResponseHandler.notFound(res, 'Postulación no encontrada');
      }
      
      if (error.message === 'UNAUTHORIZED_UPDATE_APPLICATION') {
        return ApiResponseHandler.forbidden(res, 'No tienes permisos para actualizar esta postulación');
      }
      
      if (error.message === 'INVALID_STATUS') {
        return ApiResponseHandler.error(res, 'Estado de postulación inválido');
      }

      next(error);
    }
  }

  // Obtener ofertas de una empresa
  async getCompanyOffers(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await this.offersService.getMyOffers(
        req.user.id, 
        page, 
        limit
      );

      ApiResponseHandler.success(res, result, 'Ofertas de la empresa obtenidas exitosamente');
    } catch (error: any) {
      logger.error('Error obteniendo ofertas de la empresa:', error);
      
      if (error.message === 'COMPANY_PROFILE_NOT_FOUND') {
        return ApiResponseHandler.error(res, 'Perfil de empresa no encontrado');
      }

      next(error);
    }
  }

  // Incrementar vistas de oferta
  async incrementViews(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.offersService.incrementOfferViews(id);
      
      ApiResponseHandler.success(res, null, 'Vista registrada');
    } catch (error) {
      logger.error('Error incrementando vistas:', error);
      next(error);
    }
  }
}

export default new OffersController();