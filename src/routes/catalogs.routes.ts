import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import catalogsController from '../controllers/catalogs.controller';

const router: Router = Router();

/**
 * @route   GET /api/catalogs/benefits
 * @desc    Obtener catálogo de beneficios
 * @access  Private
 */
router.get('/benefits',
  authenticate,
  catalogsController.getBenefits
);

export default router;
