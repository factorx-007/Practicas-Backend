import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import usersController from '../controllers/users.controller';
import { authenticate, authorize, requireEmailVerification } from '../middleware/auth.middleware';
import { handleValidationErrors, validateId, validatePagination } from '../middleware/validation.middleware';
import validators from '../utils/validators';
import { UserRole } from '../types/common.types';

const router: Router = Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Obtener mi perfil completo
 *     description: Retorna el perfil completo del usuario autenticado incluyendo información específica según su rol
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
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
 *                   example: "Perfil obtenido exitosamente"
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/Student'
 *                     - $ref: '#/components/schemas/Company'
 *                     - $ref: '#/components/schemas/Institution'
 *                     - $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Usuario no encontrado"
 *               error: "USER_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/me',
  authenticate,
  usersController.getMyProfile
);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     tags: [Users]
 *     summary: Actualizar información básica
 *     description: Permite actualizar la información básica del usuario autenticado (nombre, apellido, avatar)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Juan Carlos"
 *                 description: "Nombre del usuario"
 *               apellido:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "García López"
 *                 description: "Apellido del usuario"
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/avatars/user123.jpg"
 *                 description: "URL del avatar del usuario"
 *     responses:
 *       200:
 *         description: Información actualizada exitosamente
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
 *                   example: "Usuario actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Usuario no encontrado"
 *               error: "USER_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/me',
  authenticate,
  [
    validators.common.nombre().optional(),
    validators.common.apellido().optional()
  ],
  handleValidationErrors,
  usersController.updateUser
);

/**
 * @swagger
 * /api/users/me/student:
 *   put:
 *     tags: [Users]
 *     summary: Actualizar perfil de estudiante
 *     description: Permite a estudiantes actualizar su información específica de perfil académico
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carrera:
 *                 type: string
 *                 example: "Ingeniería de Sistemas"
 *               universidad:
 *                 type: string
 *                 example: "Universidad Nacional Mayor de San Marcos"
 *               anio_ingreso:
 *                 type: integer
 *                 example: 2020
 *               anio_egreso:
 *                 type: integer
 *                 example: 2024
 *               telefono:
 *                 type: string
 *                 example: "+51 987654321"
 *               habilidades:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["JavaScript", "React", "Node.js", "Python"]
 *               experiencia:
 *                 type: array
 *                 description: Lista de experiencias laborales (campo JSON)
 *                 items:
 *                   type: object
 *                   properties:
 *                     empresa:
 *                       type: string
 *                       example: "Tech Solutions S.A."
 *                     puesto:
 *                       type: string
 *                       example: "Desarrollador Frontend Junior"
 *                     descripcion:
 *                       type: string
 *                       example: "Desarrollo de interfaces con React"
 *                     fechaInicio:
 *                       type: string
 *                       format: date
 *                       example: "2023-01-15"
 *                     fechaFin:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                       example: "2023-12-20"
 *                     esTrabajoActual:
 *                       type: boolean
 *                       example: false
 *                     ubicacion:
 *                       type: string
 *                       example: "Lima, Perú"
 *                     tipo:
 *                       type: string
 *                       enum: [TIEMPO_COMPLETO, MEDIO_TIEMPO, FREELANCE, PRACTICAS, VOLUNTARIADO]
 *                       example: TIEMPO_COMPLETO
 *                     habilidades:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["React", "TypeScript"]
 *               portafolio:
 *                 type: string
 *                 format: uri
 *                 example: "https://miportafolio.com"
 *               linkedin:
 *                 type: string
 *                 format: uri
 *                 example: "https://linkedin.com/in/juanperez"
 *               github:
 *                 type: string
 *                 format: uri
 *                 example: "https://github.com/juanperez"
 *               ubicacion:
 *                 type: string
 *                 example: "Lima, Perú"
 *               tipo:
 *                 $ref: '#/components/schemas/StudentType'
 *     responses:
 *       200:
 *         description: Perfil de estudiante actualizado exitosamente
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
 *                   example: "Perfil de estudiante actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Solo estudiantes pueden actualizar este perfil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Solo estudiantes pueden actualizar este perfil"
 *               error: "FORBIDDEN"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/me/student',
  authenticate,
  authorize(UserRole.ESTUDIANTE),
  validators.student.updateProfile(),
  handleValidationErrors,
  usersController.updateStudentProfile
);

/**
 * @route   PUT /api/users/me/company
 * @desc    Actualizar perfil de empresa
 * @access  Private (Solo empresas)
 * @body    { nombre_empresa?, rubro?, descripcion?, direccion?, telefono?, website?, logo_url? }
 */
router.put('/me/company',
  authenticate,
  authorize(UserRole.EMPRESA),
  validators.company.updateProfile(),
  handleValidationErrors,
  usersController.updateCompanyProfile
);

// Upload imagen a galería de empresa
router.post('/me/company/gallery',
  authenticate,
  authorize(UserRole.EMPRESA),
  usersController.uploadGalleryImage
);

// Eliminar imagen de galería de empresa
router.delete('/me/company/gallery',
  authenticate,
  authorize(UserRole.EMPRESA),
  body('imageUrl').isURL().withMessage('URL de imagen inválida'),
  handleValidationErrors,
  usersController.deleteGalleryImage
);

// Agregar beneficio a empresa
router.post('/me/company/benefits',
  authenticate,
  authorize(UserRole.EMPRESA),
  body('beneficioId').notEmpty().withMessage('ID de beneficio requerido'),
  body('descripcion').optional().isString(),
  handleValidationErrors,
  usersController.addCompanyBenefit
);

// Obtener beneficios de empresa
router.get('/me/company/benefits',
  authenticate,
  authorize(UserRole.EMPRESA),
  usersController.getCompanyBenefits
);

// Eliminar beneficio de empresa
router.delete('/me/company/benefits/:benefitId',
  authenticate,
  authorize(UserRole.EMPRESA),
  validateId('benefitId'),
  handleValidationErrors,
  usersController.deleteCompanyBenefit
);

/**
 * @route   PUT /api/users/me/institution
 * @desc    Actualizar perfil de institución
 * @access  Private (Solo instituciones)
 * @body    { nombre?, tipo?, direccion?, telefono?, website?, logo_url? }
 */
router.put('/me/institution',
  authenticate,
  authorize(UserRole.INSTITUCION),
  // TODO: Agregar validadores específicos para institución
  handleValidationErrors,
  usersController.updateInstitutionProfile
);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     tags: [Users]
 *     summary: Buscar usuarios
 *     description: Permite buscar usuarios con filtros avanzados. Acceso público.
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Texto libre para buscar en nombre, apellido, email
 *         schema:
 *           type: string
 *           example: "Juan García"
 *       - name: rol
 *         in: query
 *         description: Filtrar por rol de usuario
 *         schema:
 *           $ref: '#/components/schemas/UserRole'
 *       - name: verificado
 *         in: query
 *         description: Filtrar por estado de verificación de email
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: activo
 *         in: query
 *         description: Filtrar por estado activo del usuario
 *         schema:
 *           type: boolean
 *           example: true
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
 *         description: Usuarios encontrados exitosamente
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
 *                   example: "Usuarios obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/Student'
 *                       - $ref: '#/components/schemas/Company'
 *                       - $ref: '#/components/schemas/Institution'
 *                       - $ref: '#/components/schemas/User'
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
 *                       example: 45
 *                     totalPages:
 *                       type: integer
 *                       example: 5
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
  validatePagination,
  validators.search.search(),
  handleValidationErrors,
  usersController.searchUsers
);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Obtener perfil público de usuario
 *     description: Retorna el perfil público de un usuario específico por su ID
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID único del usuario
 *         schema:
 *           type: string
 *           example: "clm123abc456def"
 *     responses:
 *       200:
 *         description: Perfil de usuario obtenido exitosamente
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
 *                   example: "Perfil obtenido exitosamente"
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/Student'
 *                     - $ref: '#/components/schemas/Company'
 *                     - $ref: '#/components/schemas/Institution'
 *                     - $ref: '#/components/schemas/User'
 *       400:
 *         description: ID de usuario inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "ID de usuario inválido"
 *               error: "INVALID_USER_ID"
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Usuario no encontrado"
 *               error: "USER_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:userId',
  validateId('userId'),
  handleValidationErrors,
  usersController.getUserProfile
);

/**
 * @swagger
 * /api/users/{userId}/follow:
 *   post:
 *     tags: [Users]
 *     summary: Seguir a un usuario
 *     description: Permite seguir a otro usuario en la plataforma. Requiere email verificado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID del usuario a seguir
 *         schema:
 *           type: string
 *           example: "clm456def789ghi"
 *     responses:
 *       201:
 *         description: Usuario seguido exitosamente
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
 *                   example: "Ahora sigues a este usuario"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followerId:
 *                       type: string
 *                       example: "clm123abc456def"
 *                     followedId:
 *                       type: string
 *                       example: "clm456def789ghi"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Error de validación o lógica de negocio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               self_follow:
 *                 summary: Intento de auto-seguimiento
 *                 value:
 *                   success: false
 *                   message: "No puedes seguirte a ti mismo"
 *                   error: "CANNOT_FOLLOW_SELF"
 *               already_following:
 *                 summary: Ya siguiendo al usuario
 *                 value:
 *                   success: false
 *                   message: "Ya sigues a este usuario"
 *                   error: "ALREADY_FOLLOWING"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Email no verificado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Debes verificar tu email para seguir usuarios"
 *               error: "EMAIL_NOT_VERIFIED"
 *       404:
 *         description: Usuario a seguir no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Usuario no encontrado"
 *               error: "USER_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:userId/follow',
  authenticate,
  requireEmailVerification,
  validateId('userId'),
  handleValidationErrors,
  usersController.followUser
);

/**
 * @route   DELETE /api/users/:userId/follow
 * @desc    Dejar de seguir a un usuario
 * @access  Private
 */
router.delete('/:userId/follow',
  authenticate,
  validateId('userId'),
  handleValidationErrors,
  usersController.unfollowUser
);

router.post('/:userId/view-profile',
  authenticate,
  authorize(UserRole.EMPRESA),
  validateId('userId'),
  handleValidationErrors,
  usersController.viewProfile
);

/**
 * @route   GET /api/users/:userId/followers
 * @desc    Obtener seguidores de un usuario
 * @access  Public
 * @query   { page?, limit? }
 */
router.get('/:userId/followers',
  validateId('userId'),
  validatePagination,
  handleValidationErrors,
  usersController.getFollowers
);

/**
 * @route   GET /api/users/:userId/following
 * @desc    Obtener usuarios que sigue
 * @access  Public
 * @query   { page?, limit? }
 */
router.get('/:userId/following',
  validateId('userId'),
  validatePagination,
  handleValidationErrors,
  usersController.getFollowing
);

/**
 * @route   PUT /api/users/:userId/deactivate
 * @desc    Desactivar usuario (solo admin)
 * @access  Private (Solo admin)
 */
router.put('/:userId/deactivate',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId('userId'),
  handleValidationErrors,
  usersController.deactivateUser
);

/**
 * @route   PUT /api/users/:userId/activate
 * @desc    Activar usuario (solo admin)
 * @access  Private (Solo admin)
 */
router.put('/:userId/activate',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId('userId'),
  handleValidationErrors,
  usersController.activateUser
);

/**
 * @route   POST /api/users/upload/avatar
 * @desc    Subir avatar del usuario
 * @access  Private
 */
router.post('/upload/avatar',
  authenticate,
  usersController.uploadAvatar
);

/**
 * @route   POST /api/users/upload/cv
 * @desc    Subir CV del estudiante
 * @access  Private (Solo estudiantes)
 */
router.post('/upload/cv',
  authenticate,
  authorize(UserRole.ESTUDIANTE),
  usersController.uploadCV
);

/**
 * @route   POST /api/users/upload/logo
 * @desc    Subir logo de empresa/institución
 * @access  Private (Solo empresas e instituciones)
 * @note    Implementación futura con multer
 */
router.post('/upload/logo',
  authenticate,
  authorize(UserRole.EMPRESA, UserRole.INSTITUCION),
  (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Funcionalidad de upload no implementada aún'
    });
  }
);

export default router;