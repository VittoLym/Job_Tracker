
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';

interface StatusChangeJobPayload {
  outboxEventId: string;
  applicationId: string;
  company: string;
  role: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
}

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'status-change':
        await this.handleStatusChange(job);
        break;

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleStatusChange(
    job: Job<StatusChangeJobPayload>,
  ): Promise<void> {
    const {
      outboxEventId,
      applicationId,
      company,
      role,
      fromStatus,
      toStatus,
    } = job.data;

    if (!outboxEventId || !applicationId) {
      throw new Error(
        `Invalid status-change job payload: ${job.id}`,
      );
    }

    try {
      await this.prisma.notification.create({
        data: {
          id: outboxEventId,
          applicationId,
          type: 'STATUS_CHANGE',
          payload: {
            company,
            role,
            fromStatus,
            toStatus,
          } as Prisma.InputJsonValue,
        },
      });

      this.logger.log(
        `Notification persisted for application ${applicationId}`,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.debug(
          `Notification already exists for outbox event ${outboxEventId}`,
        );
        return;
      }

      throw error;
    }
  }
}
