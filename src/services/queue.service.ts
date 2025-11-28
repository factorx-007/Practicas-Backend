import Bull, { Queue, Job } from 'bull';
import { redisService } from '../config/redis';
import logger from '../utils/logger';
import {
  CreateNotificationDTO,
  NotificationChannel,
  NotificationPriority
} from '../types/notifications.types';
import { NotificationType } from '../types/common.types';

export interface NotificationJobData {
  type: 'single_notification' | 'bulk_notification' | 'scheduled_notification' | 'email_notification' | 'push_notification';
  payload: CreateNotificationDTO | CreateNotificationDTO[];
  priority?: NotificationPriority;
  delay?: number;
  attempts?: number;
}

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  template?: string;
  templateData?: Record<string, any>;
}

export interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channel?: string;
}

class QueueService {
  private notificationsQueue: Queue<NotificationJobData> | null = null;
  private emailQueue: Queue<EmailJobData> | null = null;
  private pushQueue: Queue<PushNotificationJobData> | null = null;
  private isInitialized = false;

  // ==================== INITIALIZATION ====================

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        logger.warn('Queue service ya está inicializado');
        return;
      }

      // Esperar a que Redis esté conectado
      if (!redisService.isReady()) {
        throw new Error('Redis debe estar conectado antes de inicializar las colas');
      }

      // ⚡ OPTIMIZACIÓN: Lazy loading mode
      const useLazyMode = process.env.QUEUE_LAZY_MODE !== 'false';

      if (useLazyMode) {
        // Modo lazy: solo validar que Redis está listo
        this.isInitialized = true;
        logger.info('✅ Queue service inicializado (lazy mode - las colas se crearán bajo demanda)');
        return;
      }

      // Modo eager: inicializar todas las colas inmediatamente
      await this.initializeAllQueues();
      this.isInitialized = true;
      logger.info('✅ Queue service inicializado correctamente (eager mode)');

    } catch (error) {
      logger.error('❌ Error inicializando Queue service:', error);
      throw error;
    }
  }

  private async initializeAllQueues(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }

    // Inicializar todas las colas
    this.notificationsQueue = new Bull('notifications', {
      redis: redisUrl,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });

    this.emailQueue = new Bull('email', {
      redis: redisUrl,
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 50,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });

    this.pushQueue = new Bull('push', {
      redis: redisUrl,
      defaultJobOptions: {
        removeOnComplete: 30,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      },
    });

    // Configurar procesadores y event listeners
    this.setupProcessors();
    this.setupEventListeners();
  }

  private setupProcessors(): void {
    if (!this.notificationsQueue || !this.emailQueue || !this.pushQueue) {
      throw new Error('Las colas no están inicializadas');
    }

    // Procesador de notificaciones
    this.notificationsQueue.process('single_notification', 10, this.processSingleNotification.bind(this));
    this.notificationsQueue.process('bulk_notification', 5, this.processBulkNotification.bind(this));
    this.notificationsQueue.process('scheduled_notification', 3, this.processScheduledNotification.bind(this));

    // Procesador de emails
    this.emailQueue.process('send_email', 5, this.processEmail.bind(this));

    // Procesador de push notifications
    this.pushQueue.process('send_push', 10, this.processPushNotification.bind(this));

    logger.info('✅ Procesadores de colas configurados');
  }

  private setupEventListeners(): void {
    const queues = [this.notificationsQueue, this.emailQueue, this.pushQueue];

    queues.forEach((queue, index) => {
      const queueNames = ['notifications', 'email', 'push'];
      const queueName = queueNames[index];

      if (queue) {
        queue.on('error', (error) => {
          logger.error(`Error en cola ${queueName}:`, error);
        });

        queue.on('waiting', (jobId) => {
          logger.debug(`Job ${jobId} en cola ${queueName} esperando`);
        });

        queue.on('active', (job) => {
          logger.debug(`Job ${job.id} en cola ${queueName} iniciado`);
        });

        queue.on('completed', (job, result) => {
          logger.debug(`Job ${job.id} en cola ${queueName} completado`);
        });

        queue.on('failed', (job, error) => {
          logger.error(`Job ${job?.id} en cola ${queueName} falló:`, error);
        });

        queue.on('stalled', (job) => {
          logger.warn(`Job ${job.id} en cola ${queueName} se atoró`);
        });
      }
    });
  }

  // ==================== NOTIFICATION PROCESSORS ====================

  private async processSingleNotification(job: Job<NotificationJobData>): Promise<void> {
    try {
      const { payload } = job.data;

      if (Array.isArray(payload)) {
        throw new Error('Single notification processor recibió array de notificaciones');
      }

      // Aquí integrarías con tu servicio de notificaciones
      // const notificationsService = new NotificationsService();
      // await notificationsService.createNotification(payload);

      logger.info(`Notificación single procesada para usuario: ${payload.destinatarioId}`);
    } catch (error) {
      logger.error('Error procesando notificación single:', error);
      throw error;
    }
  }

  private async processBulkNotification(job: Job<NotificationJobData>): Promise<void> {
    try {
      const { payload } = job.data;

      if (!Array.isArray(payload)) {
        throw new Error('Bulk notification processor requiere array de notificaciones');
      }

      // Procesar en lotes para evitar sobrecarga
      const batchSize = 10;
      for (let i = 0; i < payload.length; i += batchSize) {
        const batch = payload.slice(i, i + batchSize);

        // Procesar lote
        await Promise.all(
          batch.map(async (notification) => {
            // Aquí integrarías con tu servicio de notificaciones
            // const notificationsService = new NotificationsService();
            // await notificationsService.createNotification(notification);
          })
        );
      }

      logger.info(`Notificaciones bulk procesadas: ${payload.length} notificaciones`);
    } catch (error) {
      logger.error('Error procesando notificaciones bulk:', error);
      throw error;
    }
  }

  private async processScheduledNotification(job: Job<NotificationJobData>): Promise<void> {
    try {
      const { payload } = job.data;

      if (Array.isArray(payload)) {
        throw new Error('Scheduled notification processor no soporta arrays');
      }

      // Verificar si la notificación debe enviarse ahora
      const now = new Date();
      const scheduledTime = payload.programada ? new Date(payload.programada) : now;

      if (scheduledTime > now) {
        // Re-agendar para más tarde
        await this.scheduleNotification(payload, scheduledTime.getTime() - now.getTime());
        return;
      }

      // Enviar notificación programada
      // const notificationsService = new NotificationsService();
      // await notificationsService.createNotification(payload);

      logger.info(`Notificación programada procesada para usuario: ${payload.destinatarioId}`);
    } catch (error) {
      logger.error('Error procesando notificación programada:', error);
      throw error;
    }
  }

  // ==================== EMAIL PROCESSOR ====================

  private async processEmail(job: Job<EmailJobData>): Promise<void> {
    try {
      const { to, subject, html, template, templateData } = job.data;

      // Aquí integrarías con tu servicio de email (NodeMailer, SendGrid, etc.)
      // if (template && templateData) {
      //   // Usar template
      //   await emailService.sendTemplate(to, template, templateData);
      // } else {
      //   // Enviar HTML directo
      //   await emailService.send(to, subject, html);
      // }

      logger.info(`Email enviado a: ${to}`);
    } catch (error) {
      logger.error(`Error enviando email a ${job.data.to}:`, error);
      throw error;
    }
  }

  // ==================== PUSH NOTIFICATION PROCESSOR ====================

  private async processPushNotification(job: Job<PushNotificationJobData>): Promise<void> {
    try {
      const { userId, title, body, data, channel } = job.data;

      // Aquí integrarías con tu servicio de push notifications (Firebase, etc.)
      // await pushService.send(userId, { title, body, data, channel });

      logger.info(`Push notification enviada a usuario: ${userId}`);
    } catch (error) {
      logger.error(`Error enviando push notification a usuario ${job.data.userId}:`, error);
      throw error;
    }
  }

  // ⚡ LAZY INITIALIZATION HELPERS
  private async ensureNotificationsQueue(): Promise<Queue<NotificationJobData>> {
    if (!this.notificationsQueue) {
      logger.debug('🔧 Inicializando notifications queue (lazy)...');
      const redisUrl = process.env.REDIS_URL!;

      this.notificationsQueue = new Bull('notifications', {
        redis: redisUrl,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 100,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      });

      this.notificationsQueue.process('single_notification', 10, this.processSingleNotification.bind(this));
      this.notificationsQueue.process('bulk_notification', 5, this.processBulkNotification.bind(this));
      this.notificationsQueue.process('scheduled_notification', 3, this.processScheduledNotification.bind(this));
      this.setupQueueEventListeners(this.notificationsQueue, 'notifications');
    }
    return this.notificationsQueue;
  }

  private async ensureEmailQueue(): Promise<Queue<EmailJobData>> {
    if (!this.emailQueue) {
      logger.debug('🔧 Inicializando email queue (lazy)...');
      const redisUrl = process.env.REDIS_URL!;

      this.emailQueue = new Bull('email', {
        redis: redisUrl,
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 50,
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        },
      });

      this.emailQueue.process('send_email', 5, this.processEmail.bind(this));
      this.setupQueueEventListeners(this.emailQueue, 'email');
    }
    return this.emailQueue;
  }

  private async ensurePushQueue(): Promise<Queue<PushNotificationJobData>> {
    if (!this.pushQueue) {
      logger.debug('🔧 Inicializando push queue (lazy)...');
      const redisUrl = process.env.REDIS_URL!;

      this.pushQueue = new Bull('push', {
        redis: redisUrl,
        defaultJobOptions: {
          removeOnComplete: 30,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
        },
      });

      this.pushQueue.process('send_push', 10, this.processPushNotification.bind(this));
      this.setupQueueEventListeners(this.pushQueue, 'push');
    }
    return this.pushQueue;
  }

  private setupQueueEventListeners(queue: Queue, name: string): void {
    queue.on('error', (error) => logger.error(`Error en cola ${name}:`, error));
    queue.on('waiting', (jobId) => logger.debug(`Job ${jobId} en cola ${name} esperando`));
    queue.on('active', (job) => logger.debug(`Job ${job.id} en cola ${name} iniciado`));
    queue.on('completed', (job) => logger.debug(`Job ${job.id} en cola ${name} completado`));
    queue.on('failed', (job, error) => logger.error(`Job ${job?.id} en cola ${name} falló:`, error));
    queue.on('stalled', (job) => logger.warn(`Job ${job.id} en cola ${name} se atoró`));
  }

  // ==================== PUBLIC METHODS ====================

  async addNotification(data: CreateNotificationDTO, options?: {
    priority?: NotificationPriority;
    delay?: number;
    attempts?: number;
  }): Promise<void> {
    const queue = await this.ensureNotificationsQueue();

    const priority = this.getPriorityNumber(options?.priority || NotificationPriority.NORMAL);

    await queue.add('single_notification', {
      type: 'single_notification',
      payload: data,
      priority: options?.priority,
      delay: options?.delay,
      attempts: options?.attempts
    }, {
      priority,
      delay: options?.delay,
      attempts: options?.attempts || 3
    });

    logger.debug(`Notificación añadida a la cola para usuario: ${data.destinatarioId}`);
  }

  async addBulkNotifications(notifications: CreateNotificationDTO[], options?: {
    priority?: NotificationPriority;
    delay?: number;
  }): Promise<void> {
    const queue = await this.ensureNotificationsQueue();

    const priority = this.getPriorityNumber(options?.priority || NotificationPriority.NORMAL);

    await queue.add('bulk_notification', {
      type: 'bulk_notification',
      payload: notifications,
      priority: options?.priority,
      delay: options?.delay
    }, {
      priority,
      delay: options?.delay
    });

    logger.debug(`${notifications.length} notificaciones bulk añadidas a la cola`);
  }

  async scheduleNotification(data: CreateNotificationDTO, delayMs: number): Promise<void> {
    const queue = await this.ensureNotificationsQueue();

    await queue.add('scheduled_notification', {
      type: 'scheduled_notification',
      payload: data
    }, {
      delay: delayMs,
      priority: this.getPriorityNumber(NotificationPriority.NORMAL)
    });

    logger.debug(`Notificación programada para usuario: ${data.destinatarioId} en ${delayMs}ms`);
  }

  async sendEmail(emailData: EmailJobData, options?: {
    priority?: number;
    delay?: number;
  }): Promise<void> {
    const queue = await this.ensureEmailQueue();

    await queue.add('send_email', emailData, {
      priority: options?.priority || 5,
      delay: options?.delay
    });

    logger.debug(`Email añadido a la cola para: ${emailData.to}`);
  }

  async sendPushNotification(pushData: PushNotificationJobData, options?: {
    priority?: number;
    delay?: number;
  }): Promise<void> {
    const queue = await this.ensurePushQueue();

    await queue.add('send_push', pushData, {
      priority: options?.priority || 5,
      delay: options?.delay
    });

    logger.debug(`Push notification añadida a la cola para usuario: ${pushData.userId}`);
  }

  // ==================== QUEUE MANAGEMENT ====================

  async getQueueStats(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Queue service no está inicializado');
    }

    const stats = {};

    const queues = [
      { name: 'notifications', queue: this.notificationsQueue },
      { name: 'email', queue: this.emailQueue },
      { name: 'push', queue: this.pushQueue }
    ];

    for (const { name, queue } of queues) {
      if (queue) {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed()
        ]);

        (stats as any)[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length
        };
      }
    }

    return stats;
  }

  async cleanQueues(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    const queues = [this.notificationsQueue, this.emailQueue, this.pushQueue];

    await Promise.all(
      queues.map(async (queue) => {
        if (queue) {
          await queue.clean(24 * 60 * 60 * 1000, 'completed'); // Limpiar jobs completados de más de 24h
          await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Limpiar jobs fallidos de más de 7 días
        }
      })
    );

    logger.info('Colas limpiadas');
  }

  async pauseQueues(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    const queues = [this.notificationsQueue, this.emailQueue, this.pushQueue];
    await Promise.all(queues.map(queue => queue?.pause()));
    logger.info('Todas las colas pausadas');
  }

  async resumeQueues(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    const queues = [this.notificationsQueue, this.emailQueue, this.pushQueue];
    await Promise.all(queues.map(queue => queue?.resume()));
    logger.info('Todas las colas reanudadas');
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    const queues = [this.notificationsQueue, this.emailQueue, this.pushQueue];

    await Promise.all(
      queues.map(async (queue) => {
        if (queue) {
          await queue.close();
        }
      })
    );

    this.notificationsQueue = null;
    this.emailQueue = null;
    this.pushQueue = null;
    this.isInitialized = false;

    logger.info('✅ Queue service cerrado correctamente');
  }

  // ==================== UTILITIES ====================

  private getPriorityNumber(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.LOW:
        return 1;
      case NotificationPriority.NORMAL:
        return 5;
      case NotificationPriority.HIGH:
        return 8;
      case NotificationPriority.URGENT:
        return 10;
      default:
        return 5;
    }
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{ status: string; queues: Record<string, boolean> }> {
    const status = {
      status: 'healthy',
      queues: {
        notifications: false,
        email: false,
        push: false
      }
    };

    try {
      if (this.notificationsQueue) {
        await this.notificationsQueue.client.ping();
        status.queues.notifications = true;
      }

      if (this.emailQueue) {
        await this.emailQueue.client.ping();
        status.queues.email = true;
      }

      if (this.pushQueue) {
        await this.pushQueue.client.ping();
        status.queues.push = true;
      }

      const allHealthy = Object.values(status.queues).every(Boolean);
      status.status = allHealthy ? 'healthy' : 'partial';

    } catch (error) {
      logger.error('Health check de colas falló:', error);
      status.status = 'unhealthy';
    }

    return status;
  }
}

// Singleton instance
export const queueService = new QueueService();
export default queueService;