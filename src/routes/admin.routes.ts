import { Router } from 'express';
import { param, body, query } from 'express-validator';
import adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { handleValidationErrors, validateId, validatePagination } from '../middleware/validation.middleware';
import { UserRole } from '../types/common.types';

const router: Router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/dashboard',
  adminController.getDashboard
);

router.get('/users',
  validatePagination,
  [
    query('search').optional().isString().trim(),
    query('rol').optional().isIn(Object.values(UserRole)),
    query('activo').optional().isBoolean(),
    query('verificado').optional().isBoolean(),
    query('perfilCompleto').optional().isBoolean(),
    query('fechaDesde').optional().isISO8601(),
    query('fechaHasta').optional().isISO8601(),
    query('orderBy').optional().isIn(['createdAt', 'updatedAt', 'nombre', 'email']),
    query('order').optional().isIn(['asc', 'desc'])
  ],
  handleValidationErrors,
  adminController.getAllUsers
);

router.get('/users/stats',
  adminController.getUserStats
);

router.put('/users/:userId',
  validateId('userId'),
  [
    body('nombre').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('apellido').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isEmail(),
    body('rol').optional().isIn(Object.values(UserRole)),
    body('activo').optional().isBoolean(),
    body('emailVerificado').optional().isBoolean()
  ],
  handleValidationErrors,
  adminController.updateUser
);

router.delete('/users/:userId',
  validateId('userId'),
  handleValidationErrors,
  adminController.deleteUser
);

router.put('/users/:userId/verify-email',
  validateId('userId'),
  handleValidationErrors,
  adminController.verifyUserEmail
);

router.put('/users/:userId/role',
  validateId('userId'),
  [
    body('rol').isIn(Object.values(UserRole)).withMessage('Rol inválido')
  ],
  handleValidationErrors,
  adminController.changeUserRole
);

router.get('/offers',
  validatePagination,
  [
    query('search').optional().isString().trim(),
    query('modalidad').optional().isString(),
    query('estado').optional().isString(),
    query('empresaId').optional().isString(),
    query('verificada').optional().isBoolean(),
    query('destacada').optional().isBoolean(),
    query('fechaDesde').optional().isISO8601(),
    query('fechaHasta').optional().isISO8601(),
    query('orderBy').optional().isIn(['createdAt', 'updatedAt', 'vistas']),
    query('order').optional().isIn(['asc', 'desc'])
  ],
  handleValidationErrors,
  adminController.getAllOffers
);

router.get('/offers/stats',
  adminController.getOfferStats
);

router.put('/offers/:offerId',
  validateId('offerId'),
  [
    body('verificada').optional().isBoolean(),
    body('destacada').optional().isBoolean(),
    body('estado').optional().isIn(['ACTIVA', 'CERRADA', 'BORRADOR']),
    body('razonRechazo').optional().isString().trim()
  ],
  handleValidationErrors,
  adminController.updateOffer
);

router.delete('/offers/:offerId',
  validateId('offerId'),
  handleValidationErrors,
  adminController.deleteOffer
);

router.put('/offers/:offerId/approve',
  validateId('offerId'),
  handleValidationErrors,
  adminController.approveOffer
);

router.put('/offers/:offerId/reject',
  validateId('offerId'),
  [
    body('razon').optional().isString().trim().isLength({ max: 500 })
  ],
  handleValidationErrors,
  adminController.rejectOffer
);

router.get('/posts',
  validatePagination,
  [
    query('search').optional().isString().trim(),
    query('autorId').optional().isString(),
    query('reportado').optional().isBoolean(),
    query('oculto').optional().isBoolean(),
    query('fechaDesde').optional().isISO8601(),
    query('fechaHasta').optional().isISO8601(),
    query('orderBy').optional().isIn(['createdAt', 'updatedAt']),
    query('order').optional().isIn(['asc', 'desc'])
  ],
  handleValidationErrors,
  adminController.getAllPosts
);

router.get('/posts/stats',
  adminController.getPostStats
);

router.put('/posts/:postId/hide',
  validateId('postId'),
  [
    body('razon').optional().isString().trim().isLength({ max: 500 })
  ],
  handleValidationErrors,
  adminController.hidePost
);

router.put('/posts/:postId/unhide',
  validateId('postId'),
  handleValidationErrors,
  adminController.unhidePost
);

router.delete('/posts/:postId',
  validateId('postId'),
  handleValidationErrors,
  adminController.deletePost
);

router.delete('/comments/:commentId',
  validateId('commentId'),
  handleValidationErrors,
  adminController.deleteComment
);

export default router;