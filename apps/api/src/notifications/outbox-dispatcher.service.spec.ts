
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

  let eventId: string;
  let jobId: string;

  beforeAll(async () => {
    await prisma.$connect();
    await queue.waitUntilReady();
  });

  afterAll(async () => {
    if (jobId) {
      const job = await queue.getJob(jobId);
      if (job) await job.remove();
    }

    if (eventId) {
      await prisma.outboxEvent.deleteMany({
        where: { id: eventId },
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
    eventId = event.id;
    jobId = `outbox-${event.id}`;
    const createdEvent = await prisma.outboxEvent.findUniqueOrThrow({
        where: { id: event.id },
    });
    const databaseCheck = await prisma.$queryRaw<
    {
        id: string;
        status: string;
        availableAt: Date;
        databaseNow: Date;
        isPending: boolean;
        isAvailable: boolean;
    }[]
    >`
    SELECT
        "id",
        "status"::text AS "status",
        "availableAt",
        NOW() AS "databaseNow",
        ("status" = 'PENDING') AS "isPending",
        ("availableAt" <= NOW()) AS "isAvailable"
    FROM "OutboxEvent"
    WHERE "id" = ${event.id}
    `;
    const dispatchedCount = await dispatcher.dispatchPendingEvents();
    const eligibleEvents = await prisma.$queryRaw<
    { id: string; status: string; availableAt: Date }[]
    >`
    SELECT "id", "status", "availableAt"
    FROM "OutboxEvent"
    WHERE "status" = 'PENDING'
        AND "availableAt" <= NOW()
    ORDER BY "createdAt" ASC
    `;
        const columnTypes = await prisma.$queryRaw`
    SELECT
        column_name,
        data_type
    FROM information_schema.columns
    WHERE table_name = 'OutboxEvent'
        AND column_name IN (
        'availableAt',
        'lockedAt',
        'publishedAt',
        'updatedAt'
        )
    `;
    expect(dispatchedCount).toBe(1);

    const updatedEvent = await prisma.outboxEvent.findUniqueOrThrow({
      where: { id: event.id },
    });

    expect(updatedEvent.status).toBe(OutboxStatus.PUBLISHED);
    expect(updatedEvent.attempts).toBe(1);
    expect(updatedEvent.lockedAt).toBeNull();
    expect(updatedEvent.publishedAt).not.toBeNull();

    const job = await queue.getJob(jobId);

    expect(job).not.toBeNull();
    expect(job?.name).toBe('status-change');
    expect(job?.data.applicationId).toBe(aggregateId);
    expect(job?.data.toStatus).toBe('INTERVIEW');
  });
});
