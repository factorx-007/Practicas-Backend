import { Request, Response, NextFunction } from 'express';
import { OffersController } from '../../src/controllers/offers.controller';
import { OffersService } from '../../src/services/offers.service';
import { ApiResponseHandler } from '../../src/utils/responses';
import { AuthenticatedRequest } from '../../src/types/common.types';

// Mock del servicio
jest.mock('../../src/services/offers.service');
jest.mock('../../src/utils/responses');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => []
  }))
}));

describe('OffersController', () => {
  let offersController: OffersController;
  let mockOffersService: jest.Mocked<OffersService>;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    offersController = new OffersController();
    mockOffersService = new OffersService() as jest.Mocked<OffersService>;
    (offersController as any).offersService = mockOffersService;

    mockRequest = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        rol: 'EMPRESA'
      },
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('createOffer', () => {
    const offerData = {
      titulo: 'Desarrollador Frontend',
      descripcion: 'Buscamos desarrollador React',
      ubicacion: 'Lima',
      modalidad: 'TIEMPO_COMPLETO',
      fechaLimite: new Date('2024-12-31')
    };

    it('debería crear una oferta exitosamente', async () => {
      const mockOffer = { id: 'offer-1', ...offerData };
      mockRequest.body = offerData;

      mockOffersService.createOffer.mockResolvedValue(mockOffer);

      await offersController.createOffer(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockOffersService.createOffer).toHaveBeenCalledWith('user-1', offerData);
      expect(ApiResponseHandler.created).toHaveBeenCalledWith(
        mockResponse,
        mockOffer,
        'Oferta creada exitosamente'
      );
    });

    it('debería retornar error si usuario no autenticado', async () => {
      mockRequest.user = undefined;

      await offersController.createOffer(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(ApiResponseHandler.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        'Usuario no autenticado'
      );
    });

    it('debería manejar error de perfil de empresa no encontrado', async () => {
      mockRequest.body = offerData;
      mockOffersService.createOffer.mockRejectedValue(new Error('COMPANY_PROFILE_NOT_FOUND'));

      await offersController.createOffer(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        mockResponse,
        'Perfil de empresa no encontrado'
      );
    });
  });

  describe('getOfferById', () => {
    const offerId = 'offer-1';

    it('debería obtener una oferta por ID', async () => {
      const mockOffer = { id: offerId, titulo: 'Desarrollador Frontend' };
      mockRequest.params = { id: offerId };

      mockOffersService.getOfferById.mockResolvedValue(mockOffer);
      mockOffersService.incrementOfferViews.mockResolvedValue();

      await offersController.getOfferById(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockOffersService.getOfferById).toHaveBeenCalledWith(offerId);
      expect(mockOffersService.incrementOfferViews).toHaveBeenCalledWith(offerId);
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        mockOffer,
        'Oferta obtenida exitosamente'
      );
    });

    it('debería retornar 404 si no encuentra la oferta', async () => {
      mockRequest.params = { id: offerId };
      mockOffersService.getOfferById.mockResolvedValue(null);

      await offersController.getOfferById(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(ApiResponseHandler.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Oferta no encontrada'
      );
    });
  });

  describe('updateOffer', () => {
    const offerId = 'offer-1';
    const updateData = { titulo: 'Nuevo título' };

    it('debería actualizar una oferta exitosamente', async () => {
      const mockUpdatedOffer = { id: offerId, ...updateData };
      mockRequest.params = { id: offerId };
      mockRequest.body = updateData;

      mockOffersService.updateOffer.mockResolvedValue(mockUpdatedOffer);

      await offersController.updateOffer(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockOffersService.updateOffer).toHaveBeenCalledWith(offerId, 'user-1', updateData);
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        mockUpdatedOffer,
        'Oferta actualizada exitosamente'
      );
    });

    it('debería manejar error de oferta no encontrada', async () => {
      mockRequest.params = { id: offerId };
      mockRequest.body = updateData;
      mockOffersService.updateOffer.mockRejectedValue(new Error('OFFER_NOT_FOUND'));

      await offersController.updateOffer(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(ApiResponseHandler.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Oferta no encontrada'
      );
    });
  });

  describe('searchOffers', () => {
    it('debería buscar ofertas con filtros', async () => {
      const mockResult = {
        data: [{ id: 'offer-1', titulo: 'Desarrollador' }],
        pagination: { currentPage: 1, totalItems: 1 }
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        search: 'desarrollador',
        ubicacion: 'Lima'
      };

      mockOffersService.searchOffers.mockResolvedValue(mockResult);

      await offersController.searchOffers(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockOffersService.searchOffers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'desarrollador',
          ubicacion: 'Lima'
        }),
        1,
        10
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Ofertas obtenidas exitosamente'
      );
    });
  });

  describe('applyToOffer', () => {
    const offerId = 'offer-1';
    const applicationData = {
      mensaje: 'Estoy interesado',
      cvUrl: 'https://example.com/cv.pdf'
    };

    it('debería aplicar a una oferta exitosamente', async () => {
      const mockApplication = { id: 'application-1', offerId, ...applicationData };
      mockRequest.params = { id: offerId };
      mockRequest.body = applicationData;
      mockRequest.user = { id: 'user-1', email: 'test@example.com', rol: 'ESTUDIANTE' };

      mockOffersService.applyToOffer.mockResolvedValue(mockApplication);

      await offersController.applyToOffer(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockOffersService.applyToOffer).toHaveBeenCalledWith(
        offerId,
        'user-1',
        applicationData.cvUrl
      );
      expect(ApiResponseHandler.created).toHaveBeenCalledWith(
        mockResponse,
        mockApplication,
        'Postulación enviada exitosamente'
      );
    });

    it('debería manejar error de ya aplicado', async () => {
      mockRequest.params = { id: offerId };
      mockRequest.body = applicationData;
      mockOffersService.applyToOffer.mockRejectedValue(new Error('ALREADY_APPLIED'));

      await offersController.applyToOffer(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(ApiResponseHandler.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Ya has aplicado a esta oferta'
      );
    });
  });

  describe('updateApplicationStatus', () => {
    const applicationId = 'application-1';
    const statusData = { status: 'ACEPTADA' };

    it('debería actualizar el estado de postulación', async () => {
      const mockUpdatedApplication = { id: applicationId, estado: 'ACEPTADA' };
      mockRequest.params = { applicationId };
      mockRequest.body = statusData;

      mockOffersService.updateApplicationStatus.mockResolvedValue(mockUpdatedApplication);

      await offersController.updateApplicationStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockOffersService.updateApplicationStatus).toHaveBeenCalledWith(
        applicationId,
        'user-1',
        statusData.status
      );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        mockUpdatedApplication,
        'Estado de postulación actualizado exitosamente'
      );
    });

    it('debería manejar error de postulación no encontrada', async () => {
      mockRequest.params = { applicationId };
      mockRequest.body = statusData;
      mockOffersService.updateApplicationStatus.mockRejectedValue(new Error('APPLICATION_NOT_FOUND'));

      await offersController.updateApplicationStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(ApiResponseHandler.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Postulación no encontrada'
      );
    });
  });

  describe('getOfferApplications', () => {
    const offerId = 'offer-1';

    it('debería obtener postulaciones de una oferta', async () => {
      const mockResult = {
        data: [],
        pagination: { currentPage: 1, totalItems: 0, totalPages: 0, itemsPerPage: 10, hasNextPage: false, hasPrevPage: false }
      };

      mockRequest.params = { id: offerId };
      mockRequest.query = { page: '1', limit: '10' };

      // mockOffersService.getOfferApplications.mockResolvedValue(mockResult);

      await offersController.getOfferApplications(
        mockRequest,
        mockResponse,
        mockNext
      );

      // TODO: Implementar cuando el método exista en el servicio
      // expect(mockOffersService.getOfferApplications).toHaveBeenCalledWith(
      //   offerId,
      //   'user-1',
      //   1,
      //   10,
      //   undefined
      // );
      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Postulaciones obtenidas exitosamente'
      );
    });
  });

});