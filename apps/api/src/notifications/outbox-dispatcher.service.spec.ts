import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import { OutboxStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxDispatcherService } from './outbox-dispatcher.service';

describe('OutboxDispatcherService', () => {
  const prisma = new PrismaService();

  const testQueueName = `notifications-test-${randomUUID()}`;

  const queue = new Queue(testQueueName, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

  const dispatcher = new OutboxDispatcherService(prisma, queue);
  const aggregateId = randomUUID();
  const eventIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
    await queue.waitUntilReady();
  });

  afterAll(async () => {
    await queue.obliterate({ force: true });

    if (eventIds.length > 0) {
      await prisma.outboxEvent.deleteMany({
        where: { id: { in: eventIds } },
      });
    }

    await queue.close();
    await prisma.$disconnect();
  });

  it('should publish a pending event to BullMQ', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId,
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: aggregateId,
          company: 'Test Company',
          role: 'Backend Developer',
          fromStatus: 'APPLIED',
          toStatus: 'INTERVIEW',
        },
      },
    });

    eventIds.push(event.id);

    const dispatchedCount = await dispatcher.dispatchPendingEvents();

    expect(dispatchedCount).toBe(1);

    const updatedEvent = await prisma.outboxEvent.findUniqueOrThrow({
      where: { id: event.id },
    });

    expect(updatedEvent.status).toBe(OutboxStatus.PUBLISHED);
    expect(updatedEvent.attempts).toBe(1);
    expect(updatedEvent.lockedAt).toBeNull();
    expect(updatedEvent.publishedAt).not.toBeNull();

    const job = await queue.getJob(`outbox-${event.id}`);
    const data = job?.data as { applicationId: string; toStatus: string };
    expect(job).not.toBeNull();
    expect(job?.name).toBe('status-change');
    expect(data.applicationId).toBe(aggregateId);
    expect(data.toStatus).toBe('INTERVIEW');
  });

  it('should recover an expired event with attempts remaining', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {},
        status: OutboxStatus.PROCESSING,
        attempts: 1,
        lockedAt: new Date(Date.now() - 120_000),
      },
    });

    eventIds.push(event.id);

    await dispatcher.dispatchPendingEvents();

    const recoveredEvent = await prisma.outboxEvent.findUniqueOrThrow({
      where: { id: event.id },
    });

    expect(recoveredEvent.status).toBe(OutboxStatus.PENDING);
    expect(recoveredEvent.attempts).toBe(1);
    expect(recoveredEvent.lockedAt).toBeNull();
    expect(recoveredEvent.lastError).toBe('Previous dispatcher lease expired');
    expect(recoveredEvent.availableAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should mark an expired event as DEAD when maximum attempts are reached', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {},
        status: OutboxStatus.PROCESSING,
        attempts: 5,
        lockedAt: new Date(Date.now() - 120_000),
      },
    });

    eventIds.push(event.id);

    await dispatcher.dispatchPendingEvents();

    const recoveredEvent = await prisma.outboxEvent.findUniqueOrThrow({
      where: { id: event.id },
    });

    expect(recoveredEvent.status).toBe(OutboxStatus.DEAD);
    expect(recoveredEvent.attempts).toBe(5);
    expect(recoveredEvent.lockedAt).toBeNull();
    expect(recoveredEvent.lastError).toBe(
      'Lease expired; maximum attempts reached',
    );
  });

  it('should retry a failed dispatch with exponential backoff', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: randomUUID(),
          company: 'Test Company',
          role: 'Backend Developer',
          fromStatus: 'APPLIED',
          toStatus: 'INTERVIEW',
        },
      },
    });

    eventIds.push(event.id);

    const addSpy = jest
      .spyOn(queue, 'add')
      .mockRejectedValueOnce(new Error('Redis unavailable'));

    try {
      await dispatcher.dispatchPendingEvents();

      const updatedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(updatedEvent.status).toBe(OutboxStatus.PENDING);
      expect(updatedEvent.attempts).toBe(1);
      expect(updatedEvent.lockedAt).toBeNull();
      expect(updatedEvent.lastError).toBe('Redis unavailable');

      const delay = updatedEvent.availableAt.getTime() - Date.now();

      expect(delay).toBeGreaterThan(4_000);
      expect(delay).toBeLessThanOrEqual(5_000);
    } finally {
      addSpy.mockRestore();
    }
  });

  it('should mark an event as DEAD after the fifth failed dispatch', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: randomUUID(),
          company: 'Test Company',
          role: 'Backend Developer',
          fromStatus: 'APPLIED',
          toStatus: 'INTERVIEW',
        },
        attempts: 4,
        availableAt: new Date(Date.now() - 10_000),
      },
    });

    eventIds.push(event.id);

    const addSpy = jest
      .spyOn(queue, 'add')
      .mockRejectedValueOnce(new Error('Redis unavailable'));

    try {
      await dispatcher.dispatchPendingEvents();

      const updatedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(updatedEvent.status).toBe(OutboxStatus.DEAD);
      expect(updatedEvent.attempts).toBe(5);
      expect(updatedEvent.lockedAt).toBeNull();
      expect(updatedEvent.lastError).toBe('Redis unavailable');
    } finally {
      addSpy.mockRestore();
    }
  });

  it('should move unsupported event types directly to DEAD', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'UNKNOWN_EVENT_TYPE',
        payload: {},
      },
    });

    eventIds.push(event.id);

    const addSpy = jest.spyOn(queue, 'add');

    try {
      await dispatcher.dispatchPendingEvents();

      const updatedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(updatedEvent.status).toBe(OutboxStatus.DEAD);
      expect(updatedEvent.attempts).toBe(1);
      expect(updatedEvent.lockedAt).toBeNull();
      expect(updatedEvent.lastError).toContain(
        'Unsupported outbox event type: UNKNOWN_EVENT_TYPE',
      );

      expect(addSpy).not.toHaveBeenCalled();
    } finally {
      addSpy.mockRestore();
    }
  });

  it('should dispatch pending events when the scheduled handler runs', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: aggregateId,
          company: 'Test Company',
          role: 'Backend Developer',
          fromStatus: 'APPLIED',
          toStatus: 'INTERVIEW',
        },
      },
    });

    eventIds.push(event.id);

    await dispatcher.scheduledDispatch();

    const updatedEvent = await prisma.outboxEvent.findUniqueOrThrow({
      where: { id: event.id },
    });

    expect(updatedEvent.status).toBe(OutboxStatus.PUBLISHED);
    expect(updatedEvent.attempts).toBe(1);

    const job = await queue.getJob(`outbox-${event.id}`);
    expect(job).not.toBeNull();
  });

  it('should reject invalid payloads without publishing to BullMQ', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: aggregateId,
          toStatus: 'INTERVIEW',
        },
      },
    });

    eventIds.push(event.id);

    const addSpy = jest.spyOn(queue, 'add');

    try {
      await dispatcher.dispatchPendingEvents();

      const updatedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(addSpy).not.toHaveBeenCalled();
      expect(updatedEvent.status).toBe(OutboxStatus.PENDING);
      expect(updatedEvent.attempts).toBe(1);
      expect(updatedEvent.lastError).toContain(
        'Invalid status-change payload',
      );
      expect(updatedEvent.lockedAt).toBeNull();
    } finally {
      addSpy.mockRestore();
    }
  });

  it('should prevent overlapping scheduled dispatches', async () => {
    const dispatchSpy = jest
      .spyOn(dispatcher, 'dispatchPendingEvents')
      .mockImplementation(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        return 1;
      });

    try {
      const firstExecution = dispatcher.scheduledDispatch();
      const secondExecution = dispatcher.scheduledDispatch();

      await Promise.all([firstExecution, secondExecution]);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    } finally {
      dispatchSpy.mockRestore();
    }
  });

  it('should count only successfully published events', async () => {
    const validEvent = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: randomUUID(),
          company: 'Test Company',
          role: 'Backend Developer',
          fromStatus: 'APPLIED',
          toStatus: 'INTERVIEW',
        },
      },
    });

    const unsupportedEvent = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'UNKNOWN_EVENT_TYPE',
        payload: {},
      },
    });

    eventIds.push(validEvent.id, unsupportedEvent.id);

    const dispatched = await dispatcher.dispatchPendingEvents();

    const updatedValidEvent = await prisma.outboxEvent.findUniqueOrThrow({
      where: { id: validEvent.id },
    });

    const updatedUnsupportedEvent =
      await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: unsupportedEvent.id },
      });

    expect(dispatched).toBe(1);
    expect(updatedValidEvent.status).toBe(OutboxStatus.PUBLISHED);
    expect(updatedUnsupportedEvent.status).toBe(OutboxStatus.DEAD);
  });
  it('should handle a failure marking an already enqueued event as PUBLISHED', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: randomUUID(),
          company: 'Test Company',
          role: 'Backend Developer',
          fromStatus: 'APPLIED',
          toStatus: 'INTERVIEW',
        },
      },
    });

    eventIds.push(event.id);

    const addSpy = jest.spyOn(queue, 'add');
    const updateSpy = jest
      .spyOn(prisma.outboxEvent, 'updateMany')
      .mockRejectedValueOnce(new Error('Database unavailable'));

    try {
      await dispatcher.dispatchPendingEvents();

      expect(addSpy).toHaveBeenCalledTimes(1);

      const jobId = `outbox-${event.id}`;
      const job = await queue.getJob(jobId);

      expect(job).toBeDefined();

      const updatedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(updatedEvent.status).toBe(OutboxStatus.PENDING);
      expect(updatedEvent.attempts).toBe(1);
      expect(updatedEvent.lastError).toContain('Database unavailable');
    } finally {
      addSpy.mockRestore();
      updateSpy.mockRestore();
    }
  });

  it('should not create duplicate BullMQ jobs when retrying an already enqueued event', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Application',
        aggregateId: randomUUID(),
        eventType: 'APPLICATION_STATUS_CHANGED',
        payload: {
          applicationId: randomUUID(),
          company: 'Test Company',
          role: 'Backend Developer',
          fromStatus: 'APPLIED',
          toStatus: 'INTERVIEW',
        },
      },
    });

    eventIds.push(event.id);

    const jobId = `outbox-${event.id}`;

    const addSpy = jest.spyOn(queue, 'add');

    const updateSpy = jest
      .spyOn(prisma.outboxEvent, 'updateMany')
      .mockRejectedValueOnce(new Error('Database unavailable'));

    try {
      // Primer despacho: BullMQ acepta el job,
      // pero falla la actualización de PostgreSQL.
      const firstDispatch = await dispatcher.dispatchPendingEvents();

      expect(firstDispatch).toBe(0);
      expect(addSpy).toHaveBeenCalledTimes(1);

      let storedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(storedEvent.status).toBe(OutboxStatus.PENDING);

      const originalJob = await queue.getJob(jobId);
      expect(originalJob).toBeDefined();

      // Hacemos que el evento vuelva a estar disponible inmediatamente.
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { availableAt: new Date(Date.now() - 1000) },
      });

      // Segundo despacho: se intenta agregar el mismo jobId.
      const secondDispatch = await dispatcher.dispatchPendingEvents();

      expect(secondDispatch).toBe(1);
      expect(addSpy).toHaveBeenCalledTimes(2);

      storedEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(storedEvent.status).toBe(OutboxStatus.PUBLISHED);
      expect(storedEvent.attempts).toBe(2);

      // BullMQ conserva el mismo job, identificado por el mismo ID.
      const retriedJob = await queue.getJob(jobId);

      expect(retriedJob).toBeDefined();
      expect(retriedJob?.id).toBe(originalJob?.id);
    } finally {
      addSpy.mockRestore();
      updateSpy.mockRestore();
    }
  });
});
