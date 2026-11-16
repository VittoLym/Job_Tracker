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
export class NotificationsService {}
