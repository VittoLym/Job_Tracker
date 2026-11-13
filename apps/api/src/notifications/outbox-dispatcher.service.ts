import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma, OutboxStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface ClaimedOutboxEvent {
  id: string;
  eventType: string;
  payload: Prisma.JsonValue;
  attempts: number;
}

@Injectable()
export class OutboxDispatcherService {
  private readonly logger = new Logger(OutboxDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications')
    private readonly queue: Queue,
  ) {}

  async dispatchPendingEvents(batchSize = 10): Promise<number> {
    const limit = Math.max(1, Math.min(batchSize, 100));

    // Reclamar eventos de forma atómica.
    const events = await this.prisma.$transaction((tx) =>
        tx.$queryRaw<ClaimedOutboxEvent[]>`
            WITH candidates AS (
            SELECT "id"
            FROM "OutboxEvent"
            WHERE "status" = 'PENDING'
                AND "availableAt" <= (NOW() AT TIME ZONE 'UTC')
            ORDER BY "createdAt" ASC
            LIMIT ${limit}
            FOR UPDATE SKIP LOCKED
            )
            UPDATE "OutboxEvent" AS event
            SET
            "status" = 'PROCESSING',
            "lockedAt" = (NOW() AT TIME ZONE 'UTC'),
            "attempts" = event."attempts" + 1,
            "updatedAt" = (NOW() AT TIME ZONE 'UTC')
            FROM candidates
            WHERE event."id" = candidates."id"
            RETURNING
            event."id",
            event."eventType",
            event."payload",
            event."attempts"
        `,
    );

    for (const event of events) {
      try {
        const jobName = this.getJobName(event.eventType);

        this.logger.log(`Dispatching event: ${event.id}`);
        await this.queue.add(jobName, event.payload, {
          jobId: `outbox-${event.id}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        });

        await this.prisma.outboxEvent.updateMany({
          where: {
            id: event.id,
            status: OutboxStatus.PROCESSING,
          },
          data: {
            status: OutboxStatus.PUBLISHED,
            publishedAt: new Date(),
            lockedAt: null,
            lastError: null,
          },
        });

        this.logger.log(
          `Outbox event ${event.id} published to BullMQ`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        await this.prisma.outboxEvent.updateMany({
          where: {
            id: event.id,
            status: OutboxStatus.PROCESSING,
          },
          data: {
            status: OutboxStatus.PENDING,
            availableAt: new Date(Date.now() + 5000),
            lockedAt: null,
            lastError: message.slice(0, 2000),
          },
        });

        this.logger.error(
          `Failed to publish outbox event ${event.id}: ${message}`,
        );
      }
    }

    return events.length;
  }

  private getJobName(eventType: string): string {
    switch (eventType) {
      case 'APPLICATION_STATUS_CHANGED':
        return 'status-change';

      default:
        throw new Error(`Unsupported outbox event type: ${eventType}`);
    }
  }
}