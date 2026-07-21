import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job) {
    switch (job.name) {
      case 'status-change':
        await this.handleStatusChange(job);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleStatusChange(job: Job) {
    const { applicationId, company, role, fromStatus, toStatus } = job.data as {
      applicationId: string;
      company: string;
      role: string;
      fromStatus: ApplicationStatus | null;
      toStatus: ApplicationStatus;
    };

    this.logger.log(
      `[${applicationId}] ${company} — ${role}: ${fromStatus ?? 'NEW'} → ${toStatus}`,
    );
  }
}
