import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApplicationStatus } from '@prisma/client';

interface StatusChangePayload {
  applicationId: string;
  company: string;
  role: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

  async notifyStatusChange(payload: StatusChangePayload) {
    await this.queue.add('status-change', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
