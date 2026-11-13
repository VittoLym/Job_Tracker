
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

    expect(job).not.toBeNull();
    expect(job?.name).toBe('status-change');
    expect(job?.data.applicationId).toBe(aggregateId);
    expect(job?.data.toStatus).toBe('INTERVIEW');
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
    expect(recoveredEvent.lastError).toBe(
      'Previous dispatcher lease expired',
    );
    expect(recoveredEvent.availableAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
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
        payload: {},
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
        payload: {},
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

});
