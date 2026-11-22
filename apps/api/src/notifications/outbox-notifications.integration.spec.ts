
import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import { ApplicationStatus, OutboxStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { NotificationsProcessor } from './notifications.processor';

describe('Outbox + Notifications integration', () => {
  let prisma: PrismaService;
  let queue: Queue;
  let dispatcher: OutboxDispatcherService;
  let processor: NotificationsProcessor;

  const queueName = `notifications-integration-${randomUUID()}`;

  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  };

  let applicationId: string | undefined;
  let outboxEventId: string | undefined;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    queue = new Queue(queueName, { connection });
    await queue.waitUntilReady();

    dispatcher = new OutboxDispatcherService(prisma, queue);
    processor = new NotificationsProcessor(prisma);
  });

  afterAll(async () => {
    if (outboxEventId) {
      await prisma.outboxEvent.deleteMany({
        where: { id: outboxEventId },
      });
    }

    if (applicationId) {
      await prisma.application.deleteMany({
        where: { id: applicationId },
      });
    }

    await queue.obliterate({ force: true });
    await queue.close();
    await prisma.$disconnect();
  });

  it('should prevent duplicate notifications after a job is removed and republished', async () => {
    // 1. Crear una aplicación real.
    const application = await prisma.application.create({
      data: {
        company: 'Integration Test Company',
        role: 'Backend Developer',
        status: ApplicationStatus.APPLIED,
      },
    });

    applicationId = application.id;

    // 2. Crear el evento Outbox.
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: application.id,
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: application.id,
          company: application.company,
          role: application.role,
          fromStatus: null,
          toStatus: ApplicationStatus.APPLIED,
        },
      },
    });

    outboxEventId = event.id;

    const jobId = `outbox-${event.id}`;

    // 3. Simular un fallo al marcar PUBLISHED.
    // La primera actualización falla; el catch del dispatcher
    // podrá ejecutar su actualización de recuperación.
    const updateSpy = jest
      .spyOn(prisma.outboxEvent, 'updateMany')
      .mockRejectedValueOnce(new Error('Database unavailable'));

    try {
      const firstDispatch = await dispatcher.dispatchPendingEvents();

      expect(firstDispatch).toBe(0);

      let storedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(storedEvent.status).toBe(OutboxStatus.PENDING);

      // 4. Recuperar el job creado en BullMQ.
      let firstJob = await queue.getJob(jobId);

      expect(firstJob).toBeDefined();

      // Procesarlo manualmente mediante el processor real.
      await processor.process(firstJob!);

      // La primera notificación debe existir.
      let notifications = await prisma.notification.findMany({
        where: { id: event.id },
      });

      expect(notifications).toHaveLength(1);

      // 5. Eliminar el job de BullMQ.
      await firstJob!.remove();

      firstJob = await queue.getJob(jobId);

      expect(firstJob).toBeUndefined();

      // El evento continúa pendiente.
      storedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(storedEvent.status).toBe(OutboxStatus.PENDING);

      // 6. Volver a habilitar el evento para despacho.
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          availableAt: new Date(Date.now() - 1000),
        },
      });

      const secondDispatch = await dispatcher.dispatchPendingEvents();

      expect(secondDispatch).toBe(1);

      // 7. Obtener y procesar el nuevo job.
      const secondJob = await queue.getJob(jobId);

      expect(secondJob).toBeDefined();

      await processor.process(secondJob!);

      // 8. Verificar que PostgreSQL no creó una segunda notificación.
      notifications = await prisma.notification.findMany({
        where: { id: event.id },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].applicationId).toBe(application.id);
      expect(notifications[0].type).toBe('STATUS_CHANGE');

      // 9. El Outbox debe quedar publicado.
      storedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(storedEvent.status).toBe(OutboxStatus.PUBLISHED);
      expect(storedEvent.attempts).toBe(2);
      expect(storedEvent.lockedAt).toBeNull();
    } finally {
      updateSpy.mockRestore();
    }
  });
});
