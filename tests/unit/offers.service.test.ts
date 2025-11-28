import { OffersService } from '../../src/services/offers.service';
import { prismaMock } from '../setup';

describe('OffersService', () => {
  let offersService: OffersService;

  beforeEach(() => {
    offersService = new OffersService();
    jest.clearAllMocks();
  });

  describe('createOffer', () => {
    const userId = 'user-1';
    const offerData = {
      titulo: 'Desarrollador Frontend',
      descripcion: 'Buscamos desarrollador React con experiencia',
      ubicacion: 'Lima, Perú',
      modalidad: 'TIEMPO_COMPLETO',
      tipoEmpleo: 'TIEMPO_COMPLETO',
      nivelEducacion: 'UNIVERSITARIO',
      experiencia: 'INTERMEDIO',
      salarioMin: 3000,
      salarioMax: 5000,
      fechaLimite: new Date('2024-12-31')
    };

    it('debería crear una oferta exitosamente', async () => {
      const mockCompany = {
        id: 'company-1',
        usuarioId: userId,
        nombre_empresa: 'Tech Corp'
      };

      const mockOffer = {
        id: 'offer-1',
        titulo: offerData.titulo,
        empresaId: mockCompany.id,
        estado: 'PUBLICADA',
        empresa: mockCompany,
        postulaciones: [],
        _count: { postulaciones: 0 }
      };

      prismaMock.empresa.findUnique.mockResolvedValue(mockCompany as any);
      prismaMock.oferta.create.mockResolvedValue(mockOffer as any);

      const result = await offersService.createOffer(userId, offerData);

      expect(prismaMock.empresa.findUnique).toHaveBeenCalledWith({
        where: { usuarioId: userId }
      });
      expect(prismaMock.oferta.create).toHaveBeenCalled();
      expect(result).toEqual(mockOffer);
    });

    it('debería lanzar error si no encuentra perfil de empresa', async () => {
      prismaMock.empresa.findUnique.mockResolvedValue(null);

      await expect(offersService.createOffer(userId, offerData))
        .rejects.toThrow('COMPANY_PROFILE_NOT_FOUND');
    });
  });

  describe('getOfferById', () => {
    const offerId = 'offer-1';

    it('debería obtener una oferta por ID', async () => {
      const mockOffer = {
        id: offerId,
        titulo: 'Desarrollador Backend',
        empresa: {
          id: 'company-1',
          nombre_empresa: 'Tech Corp',
          usuario: {
            nombre: 'Juan',
            apellido: 'Pérez'
          }
        },
        postulaciones: [],
        _count: { postulaciones: 0 }
      };

      prismaMock.oferta.findUnique.mockResolvedValue(mockOffer as any);

      const result = await offersService.getOfferById(offerId);

      expect(prismaMock.oferta.findUnique).toHaveBeenCalledWith({
        where: { id: offerId },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockOffer);
    });

    it('debería retornar null si no encuentra la oferta', async () => {
      prismaMock.oferta.findUnique.mockResolvedValue(null);

      const result = await offersService.getOfferById(offerId);

      expect(result).toBeNull();
    });
  });

  describe('updateOffer', () => {
    const offerId = 'offer-1';
    const userId = 'user-1';
    const updateData = {
      titulo: 'Nuevo título',
      descripcion: 'Nueva descripción'
    };

    it('debería actualizar una oferta exitosamente', async () => {
      const mockOffer = {
        id: offerId,
        empresa: {
          usuarioId: userId
        }
      };

      const mockUpdatedOffer = {
        ...mockOffer,
        ...updateData
      };

      prismaMock.oferta.findUnique.mockResolvedValue(mockOffer as any);
      prismaMock.oferta.update.mockResolvedValue(mockUpdatedOffer as any);

      const result = await offersService.updateOffer(offerId, userId, updateData);

      expect(prismaMock.oferta.findUnique).toHaveBeenCalledWith({
        where: { id: offerId },
        include: { empresa: true }
      });
      expect(prismaMock.oferta.update).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedOffer);
    });

    it('debería lanzar error si no encuentra la oferta', async () => {
      prismaMock.oferta.findUnique.mockResolvedValue(null);

      await expect(offersService.updateOffer(offerId, userId, updateData))
        .rejects.toThrow('OFFER_NOT_FOUND');
    });

    it('debería lanzar error si no es el propietario', async () => {
      const mockOffer = {
        id: offerId,
        empresa: {
          usuarioId: 'other-user'
        }
      };

      prismaMock.oferta.findUnique.mockResolvedValue(mockOffer as any);

      await expect(offersService.updateOffer(offerId, userId, updateData))
        .rejects.toThrow('UNAUTHORIZED_OFFER_UPDATE');
    });
  });

  describe('searchOffers', () => {
    it('debería buscar ofertas con filtros', async () => {
      const filters = {
        search: 'desarrollador',
        ubicacion: 'Lima',
        modalidad: 'TIEMPO_COMPLETO'
      };

      const mockOffers = [
        {
          id: 'offer-1',
          titulo: 'Desarrollador Frontend',
          empresa: { nombre_empresa: 'Tech Corp' },
          _count: { postulaciones: 5 }
        }
      ];

      prismaMock.oferta.findMany.mockResolvedValue(mockOffers as any);
      prismaMock.oferta.count.mockResolvedValue(1);

      const result = await offersService.searchOffers(filters, 1, 10);

      expect(prismaMock.oferta.findMany).toHaveBeenCalled();
      expect(prismaMock.oferta.count).toHaveBeenCalled();
      expect(result.data).toEqual(mockOffers);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('debería buscar ofertas sin filtros', async () => {
      const mockOffers: any[] = [];
      
      prismaMock.oferta.findMany.mockResolvedValue(mockOffers as any);
      prismaMock.oferta.count.mockResolvedValue(0);

      const result = await offersService.searchOffers({}, 1, 10);

      expect(result.data).toEqual(mockOffers);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('applyToOffer', () => {
    const offerId = 'offer-1';
    const userId = 'user-1';
    const mensaje = 'Estoy interesado en la posición';
    const cvUrl = 'https://example.com/cv.pdf';

    it('debería aplicar a una oferta exitosamente', async () => {
      const mockStudent = {
        id: 'student-1',
        usuarioId: userId
      };

      const mockOffer = {
        id: offerId,
        titulo: 'Desarrollador Frontend'
      };

      const mockApplication = {
        id: 'application-1',
        estudianteId: mockStudent.id,
        ofertaId: offerId,
        mensaje,
        cv_url: cvUrl
      };

      prismaMock.estudiante.findUnique.mockResolvedValue(mockStudent as any);
      prismaMock.oferta.findUnique.mockResolvedValue(mockOffer as any);
      prismaMock.postulacion.findUnique.mockResolvedValue(null);
      prismaMock.postulacion.create.mockResolvedValue(mockApplication as any);

      const result = await offersService.applyToOffer(offerId, userId, cvUrl);

      expect(prismaMock.estudiante.findUnique).toHaveBeenCalledWith({
        where: { usuarioId: userId }
      });
      expect(prismaMock.postulacion.create).toHaveBeenCalled();
      expect(result).toEqual(mockApplication);
    });

    it('debería lanzar error si no encuentra perfil de estudiante', async () => {
      prismaMock.estudiante.findUnique.mockResolvedValue(null);

      await expect(offersService.applyToOffer(offerId, userId, cvUrl))
        .rejects.toThrow('STUDENT_PROFILE_NOT_FOUND');
    });

    it('debería lanzar error si ya aplicó a la oferta', async () => {
      const mockStudent = { id: 'student-1', usuarioId: userId };
      const mockOffer = { id: offerId };
      const mockExistingApplication = { id: 'existing-app' };

      prismaMock.estudiante.findUnique.mockResolvedValue(mockStudent as any);
      prismaMock.oferta.findUnique.mockResolvedValue(mockOffer as any);
      prismaMock.postulacion.findUnique.mockResolvedValue(mockExistingApplication as any);

      await expect(offersService.applyToOffer(offerId, userId, cvUrl))
        .rejects.toThrow('ALREADY_APPLIED');
    });
  });

  describe('updateApplicationStatus', () => {
    const applicationId = 'application-1';
    const userId = 'user-1';
    const status = 'ACEPTADO';

    it('debería actualizar el estado de la postulación', async () => {
      const mockApplication = {
        id: applicationId,
        oferta: {
          empresa: {
            usuarioId: userId
          }
        }
      };

      const mockUpdatedApplication = {
        ...mockApplication,
        estado: status
      };

      prismaMock.postulacion.findUnique.mockResolvedValue(mockApplication as any);
      prismaMock.postulacion.update.mockResolvedValue(mockUpdatedApplication as any);

      const result = await offersService.updateApplicationStatus(applicationId, userId, status);

      expect(prismaMock.postulacion.update).toHaveBeenCalledWith({
        where: { id: applicationId },
        data: { estado: status },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockUpdatedApplication);
    });

    it('debería lanzar error si no encuentra la postulación', async () => {
      prismaMock.postulacion.findUnique.mockResolvedValue(null);

      await expect(offersService.updateApplicationStatus(applicationId, userId, status))
        .rejects.toThrow('APPLICATION_NOT_FOUND');
    });
  });

  describe('incrementOfferViews', () => {
    const offerId = 'offer-1';

    it('debería incrementar las vistas de una oferta', async () => {
      prismaMock.oferta.update.mockResolvedValue({} as any);

      await offersService.incrementOfferViews(offerId);

      expect(prismaMock.oferta.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          vistas: {
            increment: 1
          }
        }
      });
    });

    it('no debería lanzar error si falla al incrementar vistas', async () => {
      prismaMock.oferta.update.mockRejectedValue(new Error('Database error'));

      // No debería lanzar error
      await expect(offersService.incrementOfferViews(offerId)).resolves.toBeUndefined();
    });
  });
});