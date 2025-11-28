import { Router } from 'express';
import { body, param, query } from 'express-validator';
import chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadChatMedia, handleMulterError } from '../middleware/upload.middleware';
import { TipoConversacion, TipoMensaje } from '../models/chat.models';

const router: any = Router();

// Validaciones para conversaciones
const validateCreateConversacion = [
  body('tipo')
    .isIn(Object.values(TipoConversacion))
    .withMessage('Tipo de conversación inválido'),
  body('nombre')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('descripcion')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('participantes')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un participante')
    .custom((participantes) => {
      if (!participantes.every((p: any) => typeof p === 'string' && p.length > 0)) {
        throw new Error('Todos los participantes deben ser IDs válidos');
      }
      return true;
    }),
  body('configuracion.notificacionesHabilitadas')
    .optional()
    .isBoolean()
    .withMessage('Notificaciones habilitadas debe ser boolean'),
  body('configuracion.soloAdminsEnvianMensajes')
    .optional()
    .isBoolean()
    .withMessage('Solo admins envían mensajes debe ser boolean')
];

const validateUpdateConversacion = [
  body('nombre')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('descripcion')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('configuracion.notificacionesHabilitadas')
    .optional()
    .isBoolean()
    .withMessage('Notificaciones habilitadas debe ser boolean'),
  body('configuracion.soloAdminsEnvianMensajes')
    .optional()
    .isBoolean()
    .withMessage('Solo admins envían mensajes debe ser boolean')
];

// Validaciones para mensajes
const validateCreateMensaje = [
  body('conversacionId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID de conversación requerido'),
  body('contenido')
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El contenido debe tener entre 1 y 2000 caracteres'),
  body('tipo')
    .optional()
    .isIn(Object.values(TipoMensaje))
    .withMessage('Tipo de mensaje inválido'),
  body('mensajeReferencia')
    .optional()
    .isString()
    .withMessage('Mensaje de referencia debe ser un ID válido')
];

const validateUpdateMensaje = [
  body('contenido')
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El contenido debe tener entre 1 y 2000 caracteres')
];

// Validaciones para parámetros
const validateUUID = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID inválido')
];

const validateConversacionId = [
  param('conversacionId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID de conversación inválido')
];

const validateParticipanteId = [
  param('participanteId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID de participante inválido')
];

// Validaciones para query parameters
const validateConversacionQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Límite debe ser entre 1 y 50'),
  query('tipo')
    .optional()
    .isIn(Object.values(TipoConversacion))
    .withMessage('Tipo de conversación inválido'),
  query('busqueda')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Búsqueda debe tener entre 1 y 100 caracteres'),
  query('activa')
    .optional()
    .isBoolean()
    .withMessage('Activa debe ser boolean'),
  query('orderBy')
    .optional()
    .isIn(['fechaCreacion', 'fechaActualizacion', 'ultimoMensaje'])
    .withMessage('Campo de ordenamiento inválido'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc')
];

const validateMensajeQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  query('fechaDesde')
    .optional()
    .isISO8601()
    .withMessage('Fecha desde inválida'),
  query('fechaHasta')
    .optional()
    .isISO8601()
    .withMessage('Fecha hasta inválida'),
  query('tipo')
    .optional()
    .isIn(Object.values(TipoMensaje))
    .withMessage('Tipo de mensaje inválido'),
  query('autorId')
    .optional()
    .isString()
    .withMessage('ID de autor inválido'),
  query('busqueda')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Búsqueda debe tener entre 1 y 100 caracteres'),
  query('orderBy')
    .optional()
    .isIn(['fechaCreacion'])
    .withMessage('Campo de ordenamiento inválido'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc')
];

// Validaciones adicionales
const validateAgregarParticipante = [
  body('participanteId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID de participante requerido')
];

const validateMarcarLeido = [
  body('conversacionId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID de conversación requerido'),
  body('mensajeId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID de mensaje requerido')
];

const validateReaccion = [
  body('emoji')
    .isString()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji debe ser válido')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Conversacion:
 *       type: object
 *       required:
 *         - tipo
 *         - participantes
 *         - creadorId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único de la conversación
 *         tipo:
 *           type: string
 *           enum: [PRIVADA, GRUPO]
 *           description: Tipo de conversación
 *         nombre:
 *           type: string
 *           maxLength: 100
 *           description: Nombre de la conversación (opcional para privadas)
 *         descripcion:
 *           type: string
 *           maxLength: 500
 *           description: Descripción de la conversación
 *         participantes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ParticipanteInfo'
 *           description: Lista de participantes
 *         creadorId:
 *           type: string
 *           description: ID del creador de la conversación
 *         ultimoMensaje:
 *           type: object
 *           properties:
 *             contenido:
 *               type: string
 *             fecha:
 *               type: string
 *               format: date-time
 *             autorId:
 *               type: string
 *         configuracion:
 *           type: object
 *           properties:
 *             notificacionesHabilitadas:
 *               type: boolean
 *               default: true
 *             soloAdminsEnvianMensajes:
 *               type: boolean
 *               default: false
 *         admins:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de administradores (solo para grupos)
 *         activa:
 *           type: boolean
 *           default: true
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *         fechaActualizacion:
 *           type: string
 *           format: date-time
 *         mensajesNoLeidos:
 *           type: integer
 *           description: Cantidad de mensajes no leídos
 *
 *     Mensaje:
 *       type: object
 *       required:
 *         - conversacionId
 *         - autorId
 *         - contenido
 *         - tipo
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del mensaje
 *         conversacionId:
 *           type: string
 *           description: ID de la conversación
 *         autorId:
 *           type: string
 *           description: ID del autor del mensaje
 *         autorNombre:
 *           type: string
 *           description: Nombre completo del autor
 *         autorAvatar:
 *           type: string
 *           description: Avatar del autor
 *         contenido:
 *           type: string
 *           maxLength: 2000
 *           description: Contenido del mensaje
 *         tipo:
 *           type: string
 *           enum: [TEXTO, IMAGEN, VIDEO, ARCHIVO, SISTEMA]
 *           description: Tipo de mensaje
 *         archivosAdjuntos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               url:
 *                 type: string
 *               tipo:
 *                 type: string
 *               tamaño:
 *                 type: number
 *         estado:
 *           type: string
 *           enum: [ENVIADO, ENTREGADO, LEIDO]
 *           description: Estado del mensaje
 *         editado:
 *           type: boolean
 *           default: false
 *         fechaEdicion:
 *           type: string
 *           format: date-time
 *         mensajeReferencia:
 *           $ref: '#/components/schemas/MensajeReferencia'
 *         reacciones:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               emoji:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date-time
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *         fechaActualizacion:
 *           type: string
 *           format: date-time
 *
 *     ParticipanteInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         avatar:
 *           type: string
 *         rol:
 *           type: string
 *         esAdmin:
 *           type: boolean
 *         ultimaConexion:
 *           type: string
 *           format: date-time
 *         enLinea:
 *           type: boolean
 *
 *     MensajeReferencia:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         autorId:
 *           type: string
 *         autorNombre:
 *           type: string
 *         contenido:
 *           type: string
 *         tipo:
 *           type: string
 *
 *     CreateConversacionRequest:
 *       type: object
 *       required:
 *         - tipo
 *         - participantes
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [PRIVADA, GRUPO]
 *           example: "GRUPO"
 *         nombre:
 *           type: string
 *           maxLength: 100
 *           example: "Equipo de Desarrollo"
 *         descripcion:
 *           type: string
 *           maxLength: 500
 *           example: "Chat para coordinación del equipo"
 *         participantes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["user1", "user2", "user3"]
 *         configuracion:
 *           type: object
 *           properties:
 *             notificacionesHabilitadas:
 *               type: boolean
 *               default: true
 *             soloAdminsEnvianMensajes:
 *               type: boolean
 *               default: false
 *
 *     CreateMensajeRequest:
 *       type: object
 *       required:
 *         - conversacionId
 *         - contenido
 *       properties:
 *         conversacionId:
 *           type: string
 *           example: "conv123"
 *         contenido:
 *           type: string
 *           maxLength: 2000
 *           example: "Hola, ¿cómo están?"
 *         tipo:
 *           type: string
 *           enum: [TEXTO, IMAGEN, VIDEO, ARCHIVO, SISTEMA]
 *           default: TEXTO
 *         mensajeReferencia:
 *           type: string
 *           description: ID del mensaje al que se responde
 */

// ==================== RUTAS DE CONVERSACIONES ====================

/**
 * @swagger
 * /api/chat/conversaciones:
 *   post:
 *     summary: Crear una nueva conversación
 *     description: Crea una conversación privada o grupal
 *     tags: [Chat - Conversaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConversacionRequest'
 *     responses:
 *       201:
 *         description: Conversación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Conversacion'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token de acceso requerido
 */
router.post(
  '/conversaciones',
  authenticate,
  validateCreateConversacion,
  chatController.createConversacion
);

/**
 * @swagger
 * /api/chat/conversaciones:
 *   get:
 *     summary: Obtener conversaciones del usuario
 *     description: Lista las conversaciones donde participa el usuario
 *     tags: [Chat - Conversaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [PRIVADA, GRUPO]
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *       - in: query
 *         name: activa
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [fechaCreacion, fechaActualizacion, ultimoMensaje]
 *           default: ultimoMensaje
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Conversaciones obtenidas exitosamente
 */
router.get(
  '/conversaciones',
  authenticate,
  validateConversacionQuery,
  chatController.getConversaciones
);

/**
 * @swagger
 * /api/chat/conversaciones/{id}:
 *   get:
 *     summary: Obtener una conversación específica
 *     description: Obtiene los detalles de una conversación
 *     tags: [Chat - Conversaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversación obtenida exitosamente
 *       404:
 *         description: Conversación no encontrada
 */
router.get(
  '/conversaciones/:id',
  authenticate,
  validateUUID,
  chatController.getConversacionById
);

/**
 * @swagger
 * /api/chat/conversaciones/{id}:
 *   put:
 *     summary: Actualizar una conversación
 *     description: Actualiza los datos de una conversación (solo admins)
 *     tags: [Chat - Conversaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 100
 *               descripcion:
 *                 type: string
 *                 maxLength: 500
 *               configuracion:
 *                 type: object
 *                 properties:
 *                   notificacionesHabilitadas:
 *                     type: boolean
 *                   soloAdminsEnvianMensajes:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Conversación actualizada exitosamente
 *       403:
 *         description: Sin permisos para actualizar
 *       404:
 *         description: Conversación no encontrada
 */
router.put(
  '/conversaciones/:id',
  authenticate,
  validateUUID,
  validateUpdateConversacion,
  chatController.updateConversacion
);

/**
 * @swagger
 * /api/chat/conversaciones/{id}/participantes:
 *   post:
 *     summary: Agregar participante a conversación
 *     description: Agrega un nuevo participante a un grupo
 *     tags: [Chat - Conversaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participanteId
 *             properties:
 *               participanteId:
 *                 type: string
 *                 example: "user123"
 *     responses:
 *       200:
 *         description: Participante agregado exitosamente
 *       403:
 *         description: Sin permisos para agregar participantes
 *       404:
 *         description: Conversación o usuario no encontrado
 *       409:
 *         description: Usuario ya está en la conversación
 */
router.post(
  '/conversaciones/:id/participantes',
  authenticate,
  validateUUID,
  validateAgregarParticipante,
  chatController.agregarParticipante
);

/**
 * @swagger
 * /api/chat/conversaciones/{id}/participantes/{participanteId}:
 *   delete:
 *     summary: Remover participante de conversación
 *     description: Remueve un participante de un grupo
 *     tags: [Chat - Conversaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: participanteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participante removido exitosamente
 *       403:
 *         description: Sin permisos para remover participantes
 *       404:
 *         description: Conversación no encontrada
 */
router.delete(
  '/conversaciones/:id/participantes/:participanteId',
  authenticate,
  validateUUID,
  validateParticipanteId,
  chatController.removerParticipante
);

// ==================== RUTAS DE MENSAJES ====================

/**
 * @swagger
 * /api/chat/mensajes:
 *   post:
 *     summary: Enviar un mensaje
 *     description: Envía un mensaje a una conversación con archivos opcionales
 *     tags: [Chat - Mensajes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - conversacionId
 *               - contenido
 *             properties:
 *               conversacionId:
 *                 type: string
 *               contenido:
 *                 type: string
 *                 maxLength: 2000
 *               tipo:
 *                 type: string
 *                 enum: [TEXTO, IMAGEN, VIDEO, ARCHIVO, SISTEMA]
 *                 default: TEXTO
 *               mensajeReferencia:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Sin permisos para enviar mensajes
 *       404:
 *         description: Conversación no encontrada
 */
router.post(
  '/mensajes',
  authenticate,
  uploadChatMedia,
  validateCreateMensaje,
  chatController.enviarMensaje,
  handleMulterError
);

/**
 * @swagger
 * /api/chat/conversaciones/{conversacionId}/mensajes:
 *   get:
 *     summary: Obtener mensajes de una conversación
 *     description: Lista los mensajes de una conversación con paginación
 *     tags: [Chat - Mensajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversacionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [TEXTO, IMAGEN, VIDEO, ARCHIVO, SISTEMA]
 *       - in: query
 *         name: autorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [fechaCreacion]
 *           default: fechaCreacion
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Mensajes obtenidos exitosamente
 *       404:
 *         description: Conversación no encontrada
 */
router.get(
  '/conversaciones/:conversacionId/mensajes',
  authenticate,
  validateConversacionId,
  validateMensajeQuery,
  chatController.getMensajes
);

/**
 * @swagger
 * /api/chat/mensajes/{id}:
 *   put:
 *     summary: Actualizar un mensaje
 *     description: Edita el contenido de un mensaje propio
 *     tags: [Chat - Mensajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Mensaje actualizado exitosamente
 *       404:
 *         description: Mensaje no encontrado o sin permisos
 */
router.put(
  '/mensajes/:id',
  authenticate,
  validateUUID,
  validateUpdateMensaje,
  chatController.updateMensaje
);

/**
 * @swagger
 * /api/chat/mensajes/{id}:
 *   delete:
 *     summary: Eliminar un mensaje
 *     description: Elimina un mensaje propio
 *     tags: [Chat - Mensajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mensaje eliminado exitosamente
 *       404:
 *         description: Mensaje no encontrado o sin permisos
 */
router.delete(
  '/mensajes/:id',
  authenticate,
  validateUUID,
  chatController.deleteMensaje
);

/**
 * @swagger
 * /api/chat/mensajes/marcar-leido:
 *   post:
 *     summary: Marcar mensajes como leídos
 *     description: Marca mensajes como leídos hasta un mensaje específico
 *     tags: [Chat - Mensajes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversacionId
 *               - mensajeId
 *             properties:
 *               conversacionId:
 *                 type: string
 *               mensajeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mensajes marcados como leídos
 *       404:
 *         description: Conversación no encontrada
 */
router.post(
  '/mensajes/marcar-leido',
  authenticate,
  validateMarcarLeido,
  chatController.marcarComoLeido
);

/**
 * @swagger
 * /api/chat/mensajes/{mensajeId}/reacciones:
 *   post:
 *     summary: Agregar reacción a mensaje
 *     description: Agrega o actualiza una reacción emoji a un mensaje
 *     tags: [Chat - Reacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mensajeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 example: "👍"
 *     responses:
 *       200:
 *         description: Reacción agregada exitosamente
 *       404:
 *         description: Mensaje no encontrado
 */
router.post(
  '/mensajes/:mensajeId/reacciones',
  authenticate,
  validateUUID,
  validateReaccion,
  chatController.agregarReaccion
);

/**
 * @swagger
 * /api/chat/mensajes/{mensajeId}/reacciones:
 *   delete:
 *     summary: Remover reacción de mensaje
 *     description: Remueve la reacción del usuario a un mensaje
 *     tags: [Chat - Reacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mensajeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reacción removida exitosamente
 *       404:
 *         description: Mensaje no encontrado
 */
router.delete(
  '/mensajes/:mensajeId/reacciones',
  authenticate,
  validateUUID,
  chatController.removerReaccion
);

// ==================== RUTAS DE ESTADÍSTICAS ====================

/**
 * @swagger
 * /api/chat/estadisticas:
 *   get:
 *     summary: Obtener estadísticas del chat
 *     description: Obtiene estadísticas generales del sistema de chat
 *     tags: [Chat - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *                         totalConversaciones:
 *                           type: integer
 *                         conversacionesActivas:
 *                           type: integer
 *                         totalMensajes:
 *                           type: integer
 *                         mensajesHoy:
 *                           type: integer
 *                         usuariosEnLinea:
 *                           type: integer
 */
router.get(
  '/estadisticas',
  authenticate,
  chatController.getEstadisticas
);

export default router;