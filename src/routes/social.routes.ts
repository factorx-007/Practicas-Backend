import { Router } from 'express';
import { body, param, query } from 'express-validator';
import socialController from '../controllers/social.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadPostMedia, handleMulterError, requireFiles } from '../middleware/upload.middleware';
import { TipoReaccion } from '../types/social.types';

const router: any = Router();

// Validaciones para posts
const validateCreatePost = [
  body('contenido')
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El contenido debe tener entre 1 y 2000 caracteres'),
  body('privado')
    .optional()
    .isBoolean()
    .withMessage('Privado debe ser un valor booleano')
];

const validateUpdatePost = [
  body('contenido')
    .optional()
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El contenido debe tener entre 1 y 2000 caracteres'),
  body('privado')
    .optional()
    .isBoolean()
    .withMessage('Privado debe ser un valor booleano')
];

// Validaciones para comentarios
const validateCreateComentario = [
  body('contenido')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('El contenido debe tener entre 1 y 1000 caracteres'),
  body('postId')
    .isString()
    .withMessage('ID del post inválido'),
  body('parentId')
    .optional()
    .isString()
    .withMessage('ID del comentario padre inválido')
];

const validateUpdateComentario = [
  body('contenido')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('El contenido debe tener entre 1 y 1000 caracteres')
];

// Validaciones para reacciones
const validateReaccion = [
  body('tipo')
    .isIn(Object.values(TipoReaccion))
    .withMessage('Tipo de reacción inválido'),
  body('postId')
    .optional()
    .isString()
    .withMessage('ID del post inválido'),
  body('comentarioId')
    .optional()
    .isString()
    .withMessage('ID del comentario inválido')
];

// Validaciones para parámetros
const validateUUID = [
  param('id').isString().withMessage('ID inválido')
];

// Validaciones para query parameters
const validatePostQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Límite debe ser entre 1 y 50'),
  query('autorId')
    .optional()
    .isString()
    .withMessage('ID del autor inválido'),
  query('fechaDesde')
    .optional()
    .isISO8601()
    .withMessage('Fecha desde inválida'),
  query('fechaHasta')
    .optional()
    .isISO8601()
    .withMessage('Fecha hasta inválida'),
  query('soloConexiones')
    .optional()
    .isBoolean()
    .withMessage('Solo conexiones debe ser boolean'),
  query('incluirComentarios')
    .optional()
    .isBoolean()
    .withMessage('Incluir comentarios debe ser boolean'),
  query('incluirReacciones')
    .optional()
    .isBoolean()
    .withMessage('Incluir reacciones debe ser boolean'),
  query('orderBy')
    .optional()
    .isIn(['createdAt', 'totalReacciones', 'totalComentarios'])
    .withMessage('Campo de ordenamiento inválido'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc')
];

const validateComentarioQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  query('postId')
    .isString()
    .withMessage('ID del post inválido'),
  query('incluirRespuestas')
    .optional()
    .isBoolean()
    .withMessage('Incluir respuestas debe ser boolean'),
  query('orderBy')
    .optional()
    .isIn(['createdAt', 'totalReacciones'])
    .withMessage('Campo de ordenamiento inválido'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - contenido
 *         - tipoPost
 *         - visibilidad
 *         - autorId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del post
 *         contenido:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           description: Contenido del post
 *         tipoPost:
 *           type: string
 *           enum: [TEXTO, IMAGEN, VIDEO, ENLACE, MIXTO]
 *           description: Tipo de contenido del post
 *         visibilidad:
 *           type: string
 *           enum: [PUBLICO, CONEXIONES, PRIVADO]
 *           description: Nivel de visibilidad del post
 *         archivosAdjuntos:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs de archivos adjuntos
 *         enlaceCompartido:
 *           type: string
 *           format: uri
 *           description: URL compartida en el post
 *         autorId:
 *           type: string
 *           format: uuid
 *           description: ID del autor del post
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *         fechaActualizacion:
 *           type: string
 *           format: date-time
 *         activo:
 *           type: boolean
 *           default: true
 *         totalComentarios:
 *           type: integer
 *           description: Número total de comentarios
 *         totalReacciones:
 *           type: integer
 *           description: Número total de reacciones
 *         yaReaccionado:
 *           type: boolean
 *           description: Si el usuario actual ya reaccionó
 *         tipoReaccionUsuario:
 *           type: string
 *           enum: [LIKE, LOVE, LAUGH, ANGRY, SAD, CELEBRATE]
 *           description: Tipo de reacción del usuario actual
 *
 *     Comentario:
 *       type: object
 *       required:
 *         - contenido
 *         - postId
 *         - autorId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         contenido:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *         postId:
 *           type: string
 *           format: uuid
 *         autorId:
 *           type: string
 *           format: uuid
 *         comentarioPadreId:
 *           type: string
 *           format: uuid
 *           description: ID del comentario padre (para respuestas)
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *         fechaActualizacion:
 *           type: string
 *           format: date-time
 *         activo:
 *           type: boolean
 *           default: true
 *         totalRespuestas:
 *           type: integer
 *           description: Número de respuestas al comentario
 *
 *     Reaccion:
 *       type: object
 *       required:
 *         - tipo
 *         - usuarioId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tipo:
 *           type: string
 *           enum: [LIKE, LOVE, LAUGH, ANGRY, SAD, CELEBRATE]
 *         postId:
 *           type: string
 *           format: uuid
 *         comentarioId:
 *           type: string
 *           format: uuid
 *         usuarioId:
 *           type: string
 *           format: uuid
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *
 *     CreatePostRequest:
 *       type: object
 *       required:
 *         - contenido
 *       properties:
 *         contenido:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           example: "¡Acabo de conseguir mi primer trabajo en tech! 🎉"
 *         tipoPost:
 *           type: string
 *           enum: [TEXTO, IMAGEN, VIDEO, ENLACE, MIXTO]
 *           example: "TEXTO"
 *         visibilidad:
 *           type: string
 *           enum: [PUBLICO, CONEXIONES, PRIVADO]
 *           default: PUBLICO
 *           example: "PUBLICO"
 *         enlaceCompartido:
 *           type: string
 *           format: uri
 *           example: "https://ejemplo.com/noticia"
 *
 *     CreateComentarioRequest:
 *       type: object
 *       required:
 *         - contenido
 *         - postId
 *       properties:
 *         contenido:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           example: "¡Felicitaciones! Muy merecido 👏"
 *         postId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         comentarioPadreId:
 *           type: string
 *           format: uuid
 *           description: Solo si es respuesta a otro comentario
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *
 *     CreateReaccionRequest:
 *       type: object
 *       required:
 *         - tipo
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [LIKE, LOVE, LAUGH, ANGRY, SAD, CELEBRATE]
 *           example: "LIKE"
 *         postId:
 *           type: string
 *           format: uuid
 *           description: ID del post (requerido si no se especifica comentarioId)
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         comentarioId:
 *           type: string
 *           format: uuid
 *           description: ID del comentario (requerido si no se especifica postId)
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 */

// ==================== RUTAS DE POSTS ====================

/**
 * @swagger
 * /api/social/posts:
 *   post:
 *     summary: Crear un nuevo post
 *     description: Crea un nuevo post con contenido opcional de multimedia
 *     tags: [Social - Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - contenido
 *             properties:
 *               contenido:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               tipoPost:
 *                 type: string
 *                 enum: [TEXTO, IMAGEN, VIDEO, ENLACE, MIXTO]
 *               visibilidad:
 *                 type: string
 *                 enum: [PUBLICO, CONEXIONES, PRIVADO]
 *                 default: PUBLICO
 *               enlaceCompartido:
 *                 type: string
 *                 format: uri
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Imágenes del post (máximo 5)
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Videos del post (máximo 2)
 *     responses:
 *       201:
 *         description: Post creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Post'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token de acceso requerido
 */
router.post(
  '/posts',
  authenticate,
  uploadPostMedia,
  validateCreatePost,
  socialController.createPost,
  handleMulterError
);

/**
 * @swagger
 * /api/social/posts:
 *   get:
 *     summary: Obtener posts con filtros y paginación
 *     description: Obtiene una lista de posts públicos o de conexiones con filtros opcionales
 *     tags: [Social - Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Cantidad de posts por página
 *       - in: query
 *         name: tipoPost
 *         schema:
 *           type: string
 *           enum: [TEXTO, IMAGEN, VIDEO, ENLACE, MIXTO]
 *         description: Filtrar por tipo de post
 *       - in: query
 *         name: autorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por autor específico
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtrar posts desde esta fecha
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtrar posts hasta esta fecha
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Buscar en el contenido de los posts
 *       - in: query
 *         name: soloConexiones
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Solo mostrar posts de conexiones
 *       - in: query
 *         name: incluirComentarios
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir comentarios recientes
 *       - in: query
 *         name: incluirReacciones
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir reacciones recientes
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [fechaCreacion, totalReacciones, totalComentarios]
 *           default: fechaCreacion
 *         description: Campo para ordenar
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Dirección del ordenamiento
 *     responses:
 *       200:
 *         description: Posts obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         posts:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Post'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationInfo'
 */
router.get(
  '/posts',
  authenticate,
  validatePostQuery,
  socialController.getPosts
);

/**
 * @swagger
 * /api/social/posts/{id}:
 *   get:
 *     summary: Obtener un post específico
 *     description: Obtiene un post por su ID con todos sus comentarios y reacciones
 *     tags: [Social - Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del post
 *     responses:
 *       200:
 *         description: Post obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Post'
 *       403:
 *         description: No tienes permisos para ver este post
 *       404:
 *         description: Post no encontrado
 */
router.get(
  '/posts/:id',
  authenticate,
  validateUUID,
  socialController.getPostById
);

/**
 * @swagger
 * /api/social/posts/{id}:
 *   put:
 *     summary: Actualizar un post
 *     description: Actualiza el contenido y configuración de un post propio
 *     tags: [Social - Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contenido:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               visibilidad:
 *                 type: string
 *                 enum: [PUBLICO, CONEXIONES, PRIVADO]
 *               enlaceCompartido:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Post actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Post no encontrado o no autorizado
 */
router.put(
  '/posts/:id',
  authenticate,
  validateUUID,
  validateUpdatePost,
  socialController.updatePost
);

/**
 * @swagger
 * /api/social/posts/{id}:
 *   delete:
 *     summary: Eliminar un post
 *     description: Elimina un post propio (soft delete)
 *     tags: [Social - Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del post
 *     responses:
 *       200:
 *         description: Post eliminado exitosamente
 *       404:
 *         description: Post no encontrado o no autorizado
 */
router.delete(
  '/posts/:id',
  authenticate,
  validateUUID,
  socialController.deletePost
);

// ==================== RUTAS DE COMENTARIOS ====================

/**
 * @swagger
 * /api/social/comentarios:
 *   post:
 *     summary: Crear un comentario
 *     description: Crea un comentario en un post o respuesta a otro comentario
 *     tags: [Social - Comentarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComentarioRequest'
 *     responses:
 *       201:
 *         description: Comentario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comentario'
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No puedes comentar en este post
 *       404:
 *         description: Post no encontrado
 */
router.post(
  '/comentarios',
  authenticate,
  validateCreateComentario,
  socialController.createComentario
);

/**
 * @swagger
 * /api/social/comentarios:
 *   get:
 *     summary: Obtener comentarios de un post
 *     description: Obtiene los comentarios de un post con paginación
 *     tags: [Social - Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del post
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Cantidad de comentarios por página
 *       - in: query
 *         name: incluirRespuestas
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Incluir respuestas a los comentarios
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [fechaCreacion, totalReacciones]
 *           default: fechaCreacion
 *         description: Campo para ordenar
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Dirección del ordenamiento
 *     responses:
 *       200:
 *         description: Comentarios obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         comentarios:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Comentario'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationInfo'
 */
router.get(
  '/comentarios',
  authenticate,
  validateComentarioQuery,
  socialController.getComentarios
);

/**
 * @swagger
 * /api/social/comentarios/{id}:
 *   put:
 *     summary: Actualizar un comentario
 *     description: Actualiza el contenido de un comentario propio
 *     tags: [Social - Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del comentario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contenido
 *             properties:
 *               contenido:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Comentario actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Comentario no encontrado o no autorizado
 */
router.put(
  '/comentarios/:id',
  authenticate,
  validateUUID,
  validateUpdateComentario,
  socialController.updateComentario
);

/**
 * @swagger
 * /api/social/comentarios/{id}:
 *   delete:
 *     summary: Eliminar un comentario
 *     description: Elimina un comentario propio (soft delete)
 *     tags: [Social - Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del comentario
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
 *       404:
 *         description: Comentario no encontrado o no autorizado
 */
router.delete(
  '/comentarios/:id',
  authenticate,
  validateUUID,
  socialController.deleteComentario
);

// ==================== RUTAS DE REACCIONES ====================

/**
 * @swagger
 * /api/social/reacciones:
 *   post:
 *     summary: Crear o actualizar reacción
 *     description: Crea, actualiza o elimina una reacción a un post o comentario
 *     tags: [Social - Reacciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReaccionRequest'
 *     responses:
 *       200:
 *         description: Reacción procesada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accion:
 *                           type: string
 *                           enum: [creada, actualizada, eliminada]
 *                         reaccion:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Reaccion'
 *                             - type: object
 *                               nullable: true
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Post o comentario no encontrado
 */
router.post(
  '/reacciones',
  authenticate,
  validateReaccion,
  socialController.toggleReaccion
);

// ==================== RUTAS DEL FEED ====================

/**
 * @swagger
 * /api/social/feed:
 *   get:
 *     summary: Obtener feed personalizado
 *     description: Obtiene el feed personalizado del usuario con posts de conexiones y propios
 *     tags: [Social - Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Cantidad de posts por página
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [fechaCreacion, totalReacciones, totalComentarios]
 *           default: fechaCreacion
 *         description: Campo para ordenar
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Dirección del ordenamiento
 *     responses:
 *       200:
 *         description: Feed obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         posts:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Post'
 *                               - type: object
 *                                 properties:
 *                                   esDeConexion:
 *                                     type: boolean
 *                                   razonEnFeed:
 *                                     type: string
 *                                     enum: [autor, conexion, trending, recomendado]
 *                                   fechaEnFeed:
 *                                     type: string
 *                                     format: date-time
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationInfo'
 *                         ultimaActualizacion:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Token de acceso requerido
 */
router.get(
  '/feed',
  authenticate,
  validatePostQuery,
  socialController.getFeed
);

export default router;