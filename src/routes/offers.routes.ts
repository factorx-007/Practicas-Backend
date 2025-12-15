import { Router } from 'express';
import { body, param, query } from 'express-validator';
import offersController from '../controllers/offers.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/common.types';

const router: Router = Router();

// Validaciones para crear oferta
const createOfferValidation = [
  body('titulo')
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),

  body('descripcion')
    .isLength({ min: 20, max: 2000 })
    .withMessage('La descripción debe tener entre 20 y 2000 caracteres'),

  body('ubicacion')
    .isLength({ min: 2, max: 100 })
    .withMessage('La ubicación debe tener entre 2 y 100 caracteres'),

  body('modalidad')
    .isIn(['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'PRACTICA', 'FREELANCE', 'REMOTO', 'HIBRIDO', 'PRESENCIAL'])
    .withMessage('Modalidad de trabajo inválida'),

  body('salarioMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El salario mínimo debe ser un número positivo'),

  body('salarioMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El salario máximo debe ser un número positivo'),

  body('fechaLimite')
    .isISO8601()
    .withMessage('La fecha límite debe ser una fecha válida')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La fecha límite debe ser futura');
      }
      return true;
    }),

  body('preguntas')
    .optional()
    .isArray()
    .withMessage('Las preguntas deben ser un array'),

  body('preguntas.*.pregunta')
    .if(body('preguntas').exists())
    .isLength({ min: 10, max: 500 })
    .withMessage('Cada pregunta debe tener entre 10 y 500 caracteres'),

  body('preguntas.*.tipo')
    .if(body('preguntas').exists())
    .isIn(['TEXT', 'NUMBER', 'SELECT', 'TEXTAREA', 'EMAIL', 'URL'])
    .withMessage('Tipo de pregunta inválido'),

  body('preguntas.*.obligatoria')
    .if(body('preguntas').exists())
    .isBoolean()
    .withMessage('El campo obligatoria debe ser booleano')
];

// Validaciones para actualizar oferta
const updateOfferValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID de oferta requerido'),

  body('titulo')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),

  body('descripcion')
    .optional()
    .isLength({ min: 20, max: 2000 })
    .withMessage('La descripción debe tener entre 20 y 2000 caracteres'),

  body('ubicacion')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ubicación debe tener entre 2 y 100 caracteres'),

  body('modalidad')
    .optional()
    .isIn(['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'PRACTICA', 'FREELANCE', 'REMOTO', 'HIBRIDO', 'PRESENCIAL'])
    .withMessage('Modalidad de trabajo inválida'),

  body('salarioMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El salario mínimo debe ser un número positivo'),

  body('salarioMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El salario máximo debe ser un número positivo'),

  body('fechaLimite')
    .optional()
    .isISO8601()
    .withMessage('La fecha límite debe ser una fecha válida')
];

// Validaciones para aplicar a oferta
const applyToOfferValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID de oferta requerido'),

  body('mensaje')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('El mensaje no puede exceder 1000 caracteres'),

  body('cvUrl')
    .optional()
    .isURL()
    .withMessage('URL del CV inválida')
];

// Validaciones para actualizar estado de postulación
const updateApplicationStatusValidation = [
  param('applicationId')
    .isLength({ min: 1 })
    .withMessage('ID de postulación requerido'),

  body('status')
    .isIn(['PENDIENTE', 'EN_REVISION', 'ACEPTADA', 'RECHAZADA', 'ENTREVISTA'])
    .withMessage('Estado de postulación inválido'),

  body('notasEntrevistador')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden exceder 1000 caracteres')
];

// Validaciones para parámetros de consulta
const searchValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),

  query('salarioMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El salario mínimo debe ser un número positivo'),

  query('salarioMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El salario máximo debe ser un número positivo')
];

// Validación de ID en parámetros
const idValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID requerido')
];

// ===== RUTAS PÚBLICAS =====

/**
 * @swagger
 * /api/offers/search:
 *   get:
 *     tags: [Offers]
 *     summary: Buscar ofertas de trabajo
 *     description: Permite buscar ofertas con filtros avanzados. Acceso público.
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Texto libre para buscar en título y descripción
 *         schema:
 *           type: string
 *           example: "desarrollador frontend"
 *       - name: ubicacion
 *         in: query
 *         description: Filtrar por ubicación
 *         schema:
 *           type: string
 *           example: "Lima"
 *       - name: modalidad
 *         in: query
 *         description: Modalidad de trabajo
 *         schema:
 *           $ref: '#/components/schemas/ModalidadTrabajo'
 *       - name: salarioMin
 *         in: query
 *         description: Salario mínimo
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 2000
 *       - name: salarioMax
 *         in: query
 *         description: Salario máximo
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 5000
 *       - name: empresaId
 *         in: query
 *         description: ID de empresa específica
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: Número de página (empezando en 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - name: limit
 *         in: query
 *         description: Número de resultados por página
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *     responses:
 *       200:
 *         description: Ofertas encontradas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ofertas obtenidas exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Offer'
 *                       - type: object
 *                         properties:
 *                           empresa:
 *                             type: object
 *                             properties:
 *                               nombre_empresa:
 *                                 type: string
 *                               logo_url:
 *                                 type: string
 *                               verificada:
 *                                 type: boolean
 *                           _count:
 *                             type: object
 *                             properties:
 *                               postulaciones:
 *                                 type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/search',
  searchValidation,
  offersController.searchOffers.bind(offersController)
);

/**
 * @swagger
 * /api/offers/{id}:
 *   get:
 *     tags: [Offers]
 *     summary: Obtener oferta por ID
 *     description: Retorna una oferta específica con toda su información. Acceso público.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID único de la oferta
 *         schema:
 *           type: string
 *           example: "clm123abc456def"
 *     responses:
 *       200:
 *         description: Oferta obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Oferta obtenida exitosamente"
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Offer'
 *                     - type: object
 *                       properties:
 *                         empresa:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             nombre_empresa:
 *                               type: string
 *                             logo_url:
 *                               type: string
 *                             verificada:
 *                               type: boolean
 *                         _count:
 *                           type: object
 *                           properties:
 *                             postulaciones:
 *                               type: integer
 *                               description: "Número total de postulaciones"
 *       400:
 *         description: ID de oferta inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "ID de oferta inválido"
 *               error: "INVALID_OFFER_ID"
 *       404:
 *         description: Oferta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Oferta no encontrada"
 *               error: "OFFER_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id',
  idValidation,
  offersController.getOfferById.bind(offersController)
);

/**
 * @swagger
 * /api/offers/{id}/view:
 *   post:
 *     tags: [Offers]
 *     summary: Incrementar vistas de oferta
 *     description: Incrementa el contador de vistas de una oferta. Acceso público.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID único de la oferta
 *         schema:
 *           type: string
 *           example: "clm123abc456def"
 *     responses:
 *       200:
 *         description: Vista incrementada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vista registrada"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vistas:
 *                       type: integer
 *                       example: 25
 *                       description: "Número total de vistas después del incremento"
 *       400:
 *         description: ID de oferta inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Oferta no encontrada (no incrementa vistas)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vista no registrada - oferta no encontrada"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/view',
  idValidation,
  offersController.incrementViews.bind(offersController)
);

// ===== RUTAS PROTEGIDAS =====

/**
 * @swagger
 * /api/offers:
 *   post:
 *     tags: [Offers]
 *     summary: Crear nueva oferta de trabajo
 *     description: Permite a las empresas crear una nueva oferta de trabajo. Solo accesible para usuarios con rol EMPRESA.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *               - ubicacion
 *               - modalidad
 *               - fechaLimite
 *             properties:
 *               titulo:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: "Desarrollador Frontend React"
 *                 description: "Título de la oferta de trabajo"
 *               descripcion:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 2000
 *                 example: "Buscamos un desarrollador Frontend con experiencia en React, TypeScript y CSS moderno. Se valorará experiencia con Next.js y design systems."
 *                 description: "Descripción detallada de la oferta"
 *               requisitos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Experiencia con React", "Conocimientos de TypeScript", "Manejo de Git"]
 *                 description: "Lista de requisitos para el puesto"
 *               ubicacion:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Lima, Perú"
 *                 description: "Ubicación del trabajo"
 *               modalidad:
 *                 $ref: '#/components/schemas/ModalidadTrabajo'
 *               duracion:
 *                 type: string
 *                 example: "6 meses"
 *                 description: "Duración del contrato o práctica"
 *               salarioMin:
 *                 type: number
 *                 minimum: 0
 *                 example: 2500
 *                 description: "Salario mínimo ofrecido"
 *               salarioMax:
 *                 type: number
 *                 minimum: 0
 *                 example: 4000
 *                 description: "Salario máximo ofrecido"
 *               moneda:
 *                 type: string
 *                 default: "PEN"
 *                 example: "PEN"
 *                 description: "Moneda del salario (PEN, USD, EUR)"
 *               requiereCV:
 *                 type: boolean
 *                 default: true
 *                 description: "Si requiere CV para postularse"
 *               requiereCarta:
 *                 type: boolean
 *                 default: false
 *                 description: "Si requiere carta de presentación"
 *               fechaLimite:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59.000Z"
 *                 description: "Fecha límite para postulaciones (debe ser futura)"
 *               preguntas:
 *                 type: array
 *                 description: "Preguntas adicionales para los postulantes"
 *                 items:
 *                   type: object
 *                   required:
 *                     - pregunta
 *                     - tipo
 *                     - obligatoria
 *                   properties:
 *                     pregunta:
 *                       type: string
 *                       minLength: 10
 *                       maxLength: 500
 *                       example: "¿Tienes experiencia previa con React?"
 *                     tipo:
 *                       type: string
 *                       enum: ["TEXT", "NUMBER", "SELECT", "TEXTAREA", "EMAIL", "URL"]
 *                       example: "SELECT"
 *                     obligatoria:
 *                       type: boolean
 *                       example: true
 *                     opciones:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Sí, más de 2 años", "Sí, menos de 2 años", "No"]
 *                       description: "Opciones para preguntas tipo SELECT"
 *     responses:
 *       201:
 *         description: Oferta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Oferta creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Offer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Perfil de empresa no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Perfil de empresa no encontrado"
 *               error: "COMPANY_PROFILE_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/',
  authenticate,
  authorize(UserRole.EMPRESA),
  createOfferValidation,
  offersController.createOffer.bind(offersController)
);

// Actualizar oferta (solo empresas propietarias)
router.put('/:id',
  authenticate,
  authorize(UserRole.EMPRESA),
  updateOfferValidation,
  offersController.updateOffer.bind(offersController)
);

// Eliminar oferta (solo empresas propietarias)
router.delete('/:id',
  authenticate,
  authorize(UserRole.EMPRESA),
  idValidation,
  offersController.deleteOffer.bind(offersController)
);

// Obtener ofertas de la empresa autenticada
router.get('/company/my-offers',
  authenticate,
  authorize(UserRole.EMPRESA),
  searchValidation,
  offersController.getCompanyOffers.bind(offersController)
);

// Obtener candidatos de la empresa
router.get('/company/candidates',
  authenticate,
  authorize(UserRole.EMPRESA),
  searchValidation,
  offersController.getAllCompanyApplications.bind(offersController)
);

// Postularse a una oferta
router.post('/:id/apply',
  authenticate,
  authorize(UserRole.ESTUDIANTE),
  applyToOfferValidation,
  offersController.applyToOffer.bind(offersController)
);

router.get('/student/my-applications',
  authenticate,
  authorize(UserRole.ESTUDIANTE),
  searchValidation,
  offersController.getStudentApplications.bind(offersController)
);

// Actualizar estado de postulación (solo empresas)
router.patch('/applications/:applicationId/status',
  authenticate,
  authorize(UserRole.EMPRESA),
  updateApplicationStatusValidation,
  offersController.updateApplicationStatus.bind(offersController)
);

// ===== RUTAS DE ADMINISTRACIÓN =====

// Obtener todas las ofertas (solo admin)
router.get('/admin/all',
  authenticate,
  authorize(UserRole.ADMIN),
  searchValidation,
  offersController.searchOffers.bind(offersController)
);

export default router;