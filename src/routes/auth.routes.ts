import { Router, Request, Response } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import validators from '../utils/validators';

const router: Router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Registrar nuevo usuario
 *     description: Permite registrar un nuevo usuario en la plataforma con información específica según su rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - email
 *               - password
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Juan"
 *               apellido:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@ejemplo.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "miPassword123"
 *               rol:
 *                 $ref: '#/components/schemas/UserRole'
 *               estudiante:
 *                 type: object
 *                 description: "Información adicional para estudiantes (SOLO enviar si rol = ESTUDIANTE)"
 *                 properties:
 *                   carrera:
 *                     type: string
 *                     example: "Ingeniería de Sistemas"
 *                   tipo:
 *                     $ref: '#/components/schemas/StudentType'
 *               empresa:
 *                 type: object
 *                 description: "Información adicional para empresas (SOLO enviar si rol = EMPRESA)"
 *                 properties:
 *                   ruc:
 *                     type: string
 *                     example: "20123456789"
 *                   nombre_empresa:
 *                     type: string
 *                     example: "TechCorp SAC"
 *                   rubro:
 *                     type: string
 *                     example: "Tecnología"
 *               institucion:
 *                 type: object
 *                 description: "Información adicional para instituciones (SOLO enviar si rol = INSTITUCION)"
 *                 properties:
 *                   codigo_institucional:
 *                     type: string
 *                     example: "UNIV001"
 *                   nombre:
 *                     type: string
 *                     example: "Universidad Nacional"
 *                   tipo:
 *                     type: string
 *                     example: "Universidad"
 *           examples:
 *             estudiante:
 *               summary: "Registro de Estudiante"
 *               description: "Ejemplo de registro para un estudiante"
 *               value:
 *                 nombre: "Juan"
 *                 apellido: "Pérez"
 *                 email: "juan.perez@ejemplo.com"
 *                 password: "miPassword123"
 *                 rol: "ESTUDIANTE"
 *                 estudiante:
 *                   carrera: "Ingeniería de Sistemas"
 *                   tipo: "ESTUDIANTE"
 *             empresa:
 *               summary: "Registro de Empresa"
 *               description: "Ejemplo de registro para una empresa"
 *               value:
 *                 nombre: "María"
 *                 apellido: "García"
 *                 email: "maria.garcia@techcorp.com"
 *                 password: "miPassword123"
 *                 rol: "EMPRESA"
 *                 empresa:
 *                   ruc: "20123456789"
 *                   nombre_empresa: "TechCorp SAC"
 *                   rubro: "Tecnología"
 *             institucion:
 *               summary: "Registro de Institución"
 *               description: "Ejemplo de registro para una institución educativa"
 *               value:
 *                 nombre: "Carlos"
 *                 apellido: "López"
 *                 email: "carlos.lopez@universidad.edu.pe"
 *                 password: "miPassword123"
 *                 rol: "INSTITUCION"
 *                 institucion:
 *                   codigo_institucional: "UNIV001"
 *                   nombre: "Universidad Nacional"
 *                   tipo: "Universidad"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
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
 *                   example: "Usuario registrado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: El email ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "El email ya está registrado"
 *               error: "EMAIL_ALREADY_EXISTS"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register',
  validators.auth.register(),
  handleValidationErrors,
  authController.register.bind(authController)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Iniciar sesión
 *     description: Permite a un usuario iniciar sesión con email y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@ejemplo.com"
 *               password:
 *                 type: string
 *                 example: "miPassword123"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
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
 *                   example: "Inicio de sesión exitoso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           description: "Token JWT para autenticación (válido por 15 minutos)"
 *                         refreshToken:
 *                           type: string
 *                           description: "Token para renovar el accessToken (válido por 7 días)"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Credenciales inválidas"
 *               error: "INVALID_CREDENTIALS"
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
 *       403:
 *         description: Cuenta desactivada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Tu cuenta ha sido desactivada"
 *               error: "ACCOUNT_DEACTIVATED"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login',
  validators.auth.login(),
  handleValidationErrors,
  authController.login.bind(authController)
);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     tags: [Authentication]
 *     summary: Autenticación con Google OAuth
 *     description: Permite login o registro usando Google OAuth. Si el usuario no existe, se registra automáticamente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleId
 *               - email
 *               - nombre
 *               - apellido
 *               - rol
 *             properties:
 *               googleId:
 *                 type: string
 *                 description: "ID único del usuario en Google"
 *                 example: "1234567890"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@gmail.com"
 *               nombre:
 *                 type: string
 *                 example: "Juan"
 *               apellido:
 *                 type: string
 *                 example: "Pérez"
 *               avatar:
 *                 type: string
 *                 description: "URL del avatar de Google (opcional)"
 *                 example: "https://lh3.googleusercontent.com/a/default-user"
 *               rol:
 *                 $ref: '#/components/schemas/UserRole'
 *     responses:
 *       200:
 *         description: Autenticación exitosa (usuario existente)
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
 *                   example: "Login con Google exitoso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       201:
 *         description: Usuario registrado exitosamente (nuevo usuario)
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
 *                   example: "Usuario registrado con Google exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/google',
  // Validaciones específicas para Google Auth
  [
    validators.common.email(),
    validators.common.nombre(),
    validators.common.apellido(),
    validators.common.rol()
  ],
  handleValidationErrors,
  authController.googleAuth.bind(authController)
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refrescar tokens de acceso
 *     description: Permite obtener nuevos tokens de acceso usando un refresh token válido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: "Refresh token válido obtenido en login"
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Tokens refrescados exitosamente
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
 *                   example: "Tokens refrescados exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: "Nuevo access token (válido por 15 minutos)"
 *                     refreshToken:
 *                       type: string
 *                       description: "Nuevo refresh token (válido por 7 días)"
 *       400:
 *         description: Refresh token requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Refresh token requerido"
 *               error: "REFRESH_TOKEN_REQUIRED"
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Refresh token inválido"
 *               error: "INVALID_REFRESH_TOKEN"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/refresh',
  authController.refreshTokens.bind(authController)
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Cambiar contraseña
 *     description: Permite a un usuario autenticado cambiar su contraseña
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: "Contraseña actual del usuario"
 *                 example: "miPasswordActual123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: "Nueva contraseña (mínimo 6 caracteres)"
 *                 example: "miNuevaPassword456"
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
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
 *                   example: "Contraseña actualizada exitosamente"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Contraseña actual incorrecta o no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               unauthorized:
 *                 summary: No autenticado
 *                 value:
 *                   success: false
 *                   message: "Token de acceso requerido"
 *                   error: "UNAUTHORIZED"
 *               wrong_password:
 *                 summary: Contraseña incorrecta
 *                 value:
 *                   success: false
 *                   message: "Contraseña actual incorrecta"
 *                   error: "INVALID_CURRENT_PASSWORD"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/change-password',
  authenticate,
  validators.auth.changePassword(),
  handleValidationErrors,
  authController.changePassword.bind(authController)
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Cerrar sesión
 *     description: Cierra la sesión del usuario invalidando su refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
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
 *                   example: "Sesión cerrada exitosamente"
 *       401:
 *         description: Token inválido (pero permite logout)
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
 *                   example: "Sesión cerrada"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/logout',
  optionalAuthenticate, // Permitir logout incluso con token inválido
  authController.logout.bind(authController)
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Obtener información del usuario autenticado
 *     description: Retorna la información completa del usuario autenticado incluyendo su perfil específico según el rol
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario obtenida exitosamente
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
 *                   example: "Usuario obtenido exitosamente"
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
  authController.me.bind(authController)
);

/**
 * @route   GET /api/auth/check
 * @desc    Verificar estado de autenticación
 * @access  Public (con autenticación opcional)
 */
router.get('/check',
  optionalAuthenticate,
  authController.checkAuth.bind(authController)
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar reset de contraseña
 * @access  Public
 * @body    { email }
 * @note    Implementación futura
 */
router.post('/forgot-password',
  validators.auth.resetPassword(),
  handleValidationErrors,
  (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Funcionalidad no implementada aún'
    });
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Confirmar reset de contraseña
 * @access  Public
 * @body    { token, newPassword }
 * @note    Implementación futura
 */
router.post('/reset-password',
  validators.auth.confirmReset(),
  handleValidationErrors,
  (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Funcionalidad no implementada aún'
    });
  }
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verificar email del usuario
 * @access  Public
 * @body    { token }
 * @note    Implementación futura
 */
router.post('/verify-email',
  (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Funcionalidad no implementada aún'
    });
  }
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Reenviar email de verificación
 * @access  Private
 * @note    Implementación futura
 */
router.post('/resend-verification',
  authenticate,
  (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Funcionalidad no implementada aún'
    });
  }
);

export default router;