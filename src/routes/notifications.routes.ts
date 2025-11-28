import { Router } from 'express';
import { body, param, query } from 'express-validator';
import notificationsController from '../controllers/notifications.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/common.types';
import {
  NotificationStatus,
  NotificationPriority,
  NotificationChannel
} from '../types/notifications.types';
import { NotificationType } from '../types/common.types';

const router: any = Router();

// ==================== VALIDACIONES ====================

// Validaciones para crear notificación
const validateCreateNotification = [
  body('titulo')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('El título debe tener entre 1 y 200 caracteres')
    .trim(),
  body('mensaje')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('El mensaje debe tener entre 1 y 1000 caracteres')
    .trim(),
  body('tipo')
    .isIn(Object.values(NotificationType))
    .withMessage('Tipo de notificación inválido'),
  body('destinatarioId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID del destinatario es requerido'),
  body('remitenteId')
    .optional()
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID del remitente debe ser válido'),
  body('prioridad')
    .optional()
    .isIn(Object.values(NotificationPriority))
    .withMessage('Prioridad inválida'),
  body('canales')
    .optional()
    .isArray()
    .custom((canales) => {
      if (!canales.every((canal: any) => Object.values(NotificationChannel).includes(canal))) {
        throw new Error('Canales inválidos');
      }
      return true;
    }),
  body('programada')
    .optional()
    .isISO8601()
    .withMessage('Fecha de programación debe ser válida'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Fecha de expiración debe ser válida'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata debe ser un objeto'),
  body('acciones')
    .optional()
    .isArray()
    .withMessage('Acciones debe ser un array')
];

// Validaciones para notificaciones masivas
const validateCreateBulkNotifications = [
  body('titulo')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('El título debe tener entre 1 y 200 caracteres')
    .trim(),
  body('mensaje')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('El mensaje debe tener entre 1 y 1000 caracteres')
    .trim(),
  body('tipo')
    .isIn(Object.values(NotificationType))
    .withMessage('Tipo de notificación inválido'),
  body('destinatarioIds')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Debe incluir entre 1 y 1000 destinatarios')
    .custom((ids) => {
      if (!ids.every((id: any) => typeof id === 'string' && id.length > 0)) {
        throw new Error('Todos los IDs de destinatarios deben ser válidos');
      }
      return true;
    }),
  body('prioridad')
    .optional()
    .isIn(Object.values(NotificationPriority))
    .withMessage('Prioridad inválida'),
  body('canales')
    .optional()
    .isArray()
    .custom((canales) => {
      if (!canales.every((canal: any) => Object.values(NotificationChannel).includes(canal))) {
        throw new Error('Canales inválidos');
      }
      return true;
    })
];

// Validaciones para actualizar notificación
const validateUpdateNotification = [
  body('leida')
    .optional()
    .isBoolean()
    .withMessage('Leída debe ser boolean'),
  body('estado')
    .optional()
    .isIn(Object.values(NotificationStatus))
    .withMessage('Estado inválido'),
  body('fechaLectura')
    .optional()
    .isISO8601()
    .withMessage('Fecha de lectura debe ser válida')
];

// Validaciones para parámetros de consulta
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe estar entre 1 y 100'),
  query('tipo')
    .optional()
    .isIn(Object.values(NotificationType))
    .withMessage('Tipo de notificación inválido'),
  query('estado')
    .optional()
    .isIn(Object.values(NotificationStatus))
    .withMessage('Estado inválido'),
  query('prioridad')
    .optional()
    .isIn(Object.values(NotificationPriority))
    .withMessage('Prioridad inválida'),
  query('leida')
    .optional()
    .isBoolean()
    .withMessage('Leída debe ser boolean'),
  query('fechaDesde')
    .optional()
    .isISO8601()
    .withMessage('Fecha desde debe ser válida'),
  query('fechaHasta')
    .optional()
    .isISO8601()
    .withMessage('Fecha hasta debe ser válida'),
  query('busqueda')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Búsqueda no puede exceder 100 caracteres'),
  query('orderBy')
    .optional()
    .isIn(['fechaCreacion', 'fechaActualizacion', 'prioridad'])
    .withMessage('Campo de ordenamiento inválido'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc')
];

// Validación de ID de parámetro
const validateNotificationId = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID de notificación requerido')
];

// Validaciones para configuración de notificaciones
const validateNotificationSettings = [
  body('configuracion')
    .optional()
    .isObject()
    .withMessage('Configuración debe ser un objeto'),
  body('noMolestar')
    .optional()
    .isBoolean()
    .withMessage('No molestar debe ser boolean'),
  body('horarioNoMolestarDesde')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Horario desde debe tener formato HH:mm'),
  body('horarioNoMolestarHasta')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Horario hasta debe tener formato HH:mm'),
  body('diasNoMolestar')
    .optional()
    .isArray()
    .custom((dias) => {
      if (!dias.every((dia: any) => Number.isInteger(dia) && dia >= 0 && dia <= 6)) {
        throw new Error('Días no molestar deben ser números entre 0 y 6');
      }
      return true;
    })
];

// Validaciones para templates
const validateCreateTemplate = [
  body('nombre')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres')
    .trim(),
  body('tipo')
    .isIn(Object.values(NotificationType))
    .withMessage('Tipo de notificación inválido'),
  body('titulo')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('El título debe tener entre 1 y 200 caracteres')
    .trim(),
  body('mensaje')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('El mensaje debe tener entre 1 y 1000 caracteres')
    .trim(),
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables debe ser un array'),
  body('canales')
    .optional()
    .isArray()
    .custom((canales) => {
      if (!canales.every((canal: any) => Object.values(NotificationChannel).includes(canal))) {
        throw new Error('Canales inválidos');
      }
      return true;
    }),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser boolean')
];

// ==================== RUTAS PRINCIPALES ====================

// Crear notificación individual
router.post(
  '/',
  authenticate,
  validateCreateNotification,
  notificationsController.createNotification
);

// Crear notificaciones masivas
router.post(
  '/bulk',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EMPRESA, UserRole.INSTITUCION),
  validateCreateBulkNotifications,
  notificationsController.createBulkNotifications
);

// Obtener notificaciones del usuario autenticado
router.get(
  '/my',
  authenticate,
  validateQueryParams,
  notificationsController.getMyNotifications
);

// Obtener estadísticas de notificaciones
router.get(
  '/stats',
  authenticate,
  notificationsController.getNotificationStats
);

// Obtener conteo de notificaciones no leídas
router.get(
  '/unread-count',
  authenticate,
  notificationsController.getUnreadCount
);

// Marcar todas las notificaciones como leídas
router.patch(
  '/mark-all-read',
  authenticate,
  notificationsController.markAllAsRead
);

// Obtener notificación específica
router.get(
  '/:id',
  authenticate,
  validateNotificationId,
  notificationsController.getNotificationById
);

// Actualizar notificación
router.patch(
  '/:id',
  authenticate,
  validateNotificationId,
  validateUpdateNotification,
  notificationsController.updateNotification
);

// Marcar notificación como leída
router.patch(
  '/:id/read',
  authenticate,
  validateNotificationId,
  notificationsController.markAsRead
);

// Eliminar notificación
router.delete(
  '/:id',
  authenticate,
  validateNotificationId,
  notificationsController.deleteNotification
);

// ==================== CONFIGURACIÓN DE NOTIFICACIONES ====================

// Obtener configuración de notificaciones
router.get(
  '/settings/my',
  authenticate,
  notificationsController.getNotificationSettings
);

// Actualizar configuración de notificaciones
router.patch(
  '/settings/my',
  authenticate,
  validateNotificationSettings,
  notificationsController.updateNotificationSettings
);

// ==================== TEMPLATES (ADMIN) ====================

// Crear template de notificación
router.post(
  '/templates',
  authenticate,
  authorize(UserRole.ADMIN),
  validateCreateTemplate,
  notificationsController.createTemplate
);

// Obtener templates activos
router.get(
  '/templates/active',
  authenticate,
  authorize(UserRole.ADMIN),
  notificationsController.getActiveTemplates
);

// ==================== ADMINISTRACIÓN (ADMIN) ====================

// Limpiar notificaciones expiradas
router.delete(
  '/admin/expired',
  authenticate,
  authorize(UserRole.ADMIN),
  notificationsController.cleanExpiredNotifications
);

// Procesar notificaciones programadas
router.post(
  '/admin/process-scheduled',
  authenticate,
  authorize(UserRole.ADMIN),
  notificationsController.processScheduledNotifications
);

// ==================== WEBHOOKS EXTERNOS ====================

// Webhook para notificaciones externas (email, push, etc.)
router.post(
  '/webhook/external',
  notificationsController.handleExternalNotificationWebhook
);

// ==================== DOCUMENTACIÓN DE RUTAS ====================

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - titulo
 *         - mensaje
 *         - tipo
 *         - destinatarioId
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la notificación
 *         titulo:
 *           type: string
 *           maxLength: 200
 *           description: Título de la notificación
 *         mensaje:
 *           type: string
 *           maxLength: 1000
 *           description: Contenido del mensaje
 *         tipo:
 *           type: string
 *           enum: [NUEVA_OFERTA, POSTULACION, MENSAJE, REACCION, COMENTARIO, SEGUIMIENTO, ACTUALIZACION_PERFIL, SISTEMA]
 *           description: Tipo de notificación
 *         destinatarioId:
 *           type: string
 *           description: ID del usuario destinatario
 *         remitenteId:
 *           type: string
 *           description: ID del usuario remitente
 *         estado:
 *           type: string
 *           enum: [PENDING, SENT, READ, FAILED]
 *           description: Estado de la notificación
 *         prioridad:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT]
 *           description: Prioridad de la notificación
 *         canales:
 *           type: array
 *           items:
 *             type: string
 *             enum: [IN_APP, EMAIL, PUSH, SMS]
 *           description: Canales de envío
 *         leida:
 *           type: boolean
 *           description: Si la notificación fue leída
 *         fechaLectura:
 *           type: string
 *           format: date-time
 *           description: Fecha de lectura
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         programada:
 *           type: string
 *           format: date-time
 *           description: Fecha programada de envío
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de expiración
 *         metadata:
 *           type: object
 *           description: Metadata adicional
 *         acciones:
 *           type: array
 *           items:
 *             type: object
 *           description: Acciones disponibles
 *
 * /api/notifications:
 *   post:
 *     summary: Crear una nueva notificación
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Notificación creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *
 *   get:
 *     summary: Obtener notificaciones del usuario
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Elementos por página
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *       - in: query
 *         name: leida
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de lectura
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *       401:
 *         description: No autorizado
 *
 * /api/notifications/bulk:
 *   post:
 *     summary: Crear notificaciones masivas
 *     tags: [Notifications]
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
 *               - mensaje
 *               - tipo
 *               - destinatarioIds
 *             properties:
 *               titulo:
 *                 type: string
 *               mensaje:
 *                 type: string
 *               tipo:
 *                 type: string
 *               destinatarioIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notificaciones creadas
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Sin permisos
 */

export default router;