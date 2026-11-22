import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma, OutboxStatus, ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface ClaimedOutboxEvent {
  id: string;
  eventType: string;
  payload: Prisma.JsonValue;
  attempts: number;
}
class UnsupportedOutboxEventError extends Error {
  constructor(eventType: string) {
    super(`Unsupported outbox event type: ${eventType}`);
    this.name = 'UnsupportedOutboxEventError';
  }
}
@Injectable()
export class OutboxDispatcherService {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private readonly LOCK_TIMEOUT_SECONDS = 60;
  private readonly MAX_ATTEMPTS = 5;
  private isScheduledDispatchRunning = false;
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications')
    private readonly queue: Queue,
  ) {}
  private isApplicationStatus(value: unknown): value is ApplicationStatus {
    return Object.values(ApplicationStatus).includes(
      value as ApplicationStatus,
    );
  }

  private isValidStatusChangePayload(
    payload: Prisma.JsonValue,
  ): payload is Prisma.JsonObject & {
    applicationId: string;
    company: string;
    role: string;
    fromStatus: ApplicationStatus | null;
    toStatus: ApplicationStatus;
  } {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return false;
    }

    return (
      typeof payload.applicationId === 'string' &&
      payload.applicationId.trim().length > 0 &&
      typeof payload.company === 'string' &&
      payload.company.trim().length > 0 &&
      typeof payload.role === 'string' &&
      payload.role.trim().length > 0 &&
      this.isApplicationStatus(payload.toStatus) &&
      (payload.fromStatus === null ||
        this.isApplicationStatus(payload.fromStatus))
    );
  }
  private async recoverExpiredEvents(): Promise<number> {
    const recovered = await this.prisma.$transaction(
      (tx) =>
        tx.$queryRaw<{ id: string; status: OutboxStatus; attempts: number }[]>`
        WITH expired AS (
          SELECT "id"
          FROM "OutboxEvent"
          WHERE "status" = 'PROCESSING'
            AND "lockedAt" IS NOT NULL
            AND "lockedAt" <= (
              (NOW() AT TIME ZONE 'UTC')
              - (${this.LOCK_TIMEOUT_SECONDS} * INTERVAL '1 second')
            )
          ORDER BY "lockedAt" ASC
          LIMIT 100
          FOR UPDATE SKIP LOCKED
        )
        UPDATE "OutboxEvent" AS event
        SET
          "status" = CASE
            WHEN event."attempts" >= ${this.MAX_ATTEMPTS}
              THEN 'DEAD'::"OutboxStatus"
            ELSE 'PENDING'::"OutboxStatus"
          END,
          "availableAt" = CASE
            WHEN event."attempts" >= ${this.MAX_ATTEMPTS}
              THEN event."availableAt"
            ELSE
              (NOW() AT TIME ZONE 'UTC') +
              CASE event."attempts"
                WHEN 1 THEN INTERVAL '5 seconds'
                WHEN 2 THEN INTERVAL '10 seconds'
                WHEN 3 THEN INTERVAL '20 seconds'
                ELSE INTERVAL '40 seconds'
              END
          END,
          "lockedAt" = NULL,
          "lastError" = CASE
            WHEN event."attempts" >= ${this.MAX_ATTEMPTS}
              THEN 'Lease expired; maximum attempts reached'
            ELSE 'Previous dispatcher lease expired'
          END,
          "updatedAt" = (NOW() AT TIME ZONE 'UTC')
        FROM expired
        WHERE event."id" = expired."id"
        RETURNING event."id", event."status", event."attempts"
      `,
    );

    for (const event of recovered) {
      this.logger.warn(
        `Recovered outbox event ${event.id}: ${event.status} (attempt ${event.attempts})`,
      );
    }

    return recovered.length;
  }
  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'outbox-dispatcher',
  })
  async scheduledDispatch(): Promise<void> {
    if (this.isScheduledDispatchRunning) {
      return;
    }

    this.isScheduledDispatchRunning = true;

    try {
      const dispatched = await this.dispatchPendingEvents();

      if (dispatched > 0) {
        this.logger.log(
          `Scheduled dispatch completed: ${dispatched} events published`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`Scheduled outbox dispatch failed: ${message}`);
    } finally {
      this.isScheduledDispatchRunning = false;
    }
  }
  async dispatchPendingEvents(batchSize = 10): Promise<number> {
    const limit = Math.max(1, Math.min(batchSize, 100));
    await this.recoverExpiredEvents();
    // Reclamar eventos de forma atómica.
    const events = await this.prisma.$transaction(
      (tx) =>
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
    let publishedCount = 0;
    for (const event of events) {
      try {
        const jobName = this.getJobName(event.eventType);
        if (!this.isValidStatusChangePayload(event.payload)) {
          throw new Error(
            `Invalid status-change payload for outbox event ${event.id}`,
          );
        }

        const jobPayload = {
          ...event.payload,
          outboxEventId: event.id,
        };
        this.logger.log(`Dispatching event: ${event.id}`);
        await this.queue.add(jobName, jobPayload, {
          jobId: `outbox-${event.id}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        });
        const updateResult = await this.prisma.outboxEvent.updateMany({
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

        if (updateResult.count !== 1) {
          const currentEvent = await this.prisma.outboxEvent.findUnique({
            where: { id: event.id },
            select: { status: true, attempts: true },
          });

          throw new Error(
            `Could not mark outbox event ${event.id} as PUBLISHED. ` +
              `Updated rows: ${updateResult.count}. ` +
              `Current state: ${JSON.stringify(currentEvent)}`,
          );
        }

        publishedCount++;
        this.logger.log(`Outbox event ${event.id} published to BullMQ`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        const permanentError = error instanceof UnsupportedOutboxEventError;
        const exhausted = event.attempts >= this.MAX_ATTEMPTS;
        const shouldMoveToDead = permanentError || exhausted;

        const retryDelays: Record<number, number> = {
          1: 5_000,
          2: 10_000,
          3: 20_000,
          4: 40_000,
        };

        await this.prisma.outboxEvent.updateMany({
          where: {
            id: event.id,
            status: OutboxStatus.PROCESSING,
          },
          data: {
            status: shouldMoveToDead ? OutboxStatus.DEAD : OutboxStatus.PENDING,
            ...(shouldMoveToDead
              ? {}
              : {
                  availableAt: new Date(
                    Date.now() + (retryDelays[event.attempts] ?? 40_000),
                  ),
                }),
            lockedAt: null,
            lastError: message.slice(0, 2000),
          },
        });

        if (permanentError) {
          this.logger.error(
            `Outbox event ${event.id} moved to DEAD due to unsupported event type: ${message}`,
          );
        } else if (exhausted) {
          this.logger.error(
            `Outbox event ${event.id} moved to DEAD after ${event.attempts} attempts: ${message}`,
          );
        } else {
          this.logger.warn(
            `Outbox event ${event.id} will retry after attempt ${event.attempts}: ${message}`,
          );
        }
      }
    }

    return publishedCount;
  }
  private getJobName(eventType: string): string {
    switch (eventType) {
      case 'APPLICATION_STATUS_CHANGED':
        return 'status-change';

      default:
        throw new UnsupportedOutboxEventError(eventType);
    }
  }
}
