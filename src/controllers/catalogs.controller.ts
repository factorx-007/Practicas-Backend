import { Request, Response } from 'express';
import { ApiResponseHandler } from '../utils/responses';
import prisma from '../config/database';
import logger from '../utils/logger';

export class CatalogsController {
  async getBenefits(req: Request, res: Response) {
    try {
      const benefits = await prisma.catalogoBeneficio.findMany({
        where: { activo: true },
        orderBy: [
          { categoria: 'asc' },
          { nombre: 'asc' }
        ]
      });

      // Group by category
      const grouped = benefits.reduce((acc: any, benefit) => {
        if (!acc[benefit.categoria]) {
          acc[benefit.categoria] = [];
        }
        acc[benefit.categoria].push(benefit);
        return acc;
      }, {});

      return ApiResponseHandler.success(res, {
        all: benefits,
        byCategory: grouped
      }, 'Catálogo de beneficios obtenido');
    } catch (error: any) {
      logger.error('Error obteniendo catálogo de beneficios:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }
}

export default new CatalogsController();
