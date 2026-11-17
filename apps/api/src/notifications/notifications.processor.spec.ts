import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { Job } from 'bullmq';
import {
  NotificationsProcessor,
  StatusChangeJobPayload,
} from './notifications.processor';

const makeJob = (
  name: string,
  data: Partial<StatusChangeJobPayload>,
): Job<StatusChangeJobPayload, void, string> =>
  ({
    id: 'job-1',
    name,
    data: data as StatusChangeJobPayload,
  }) as unknown as Job<StatusChangeJobPayload, void, string>;
describe('NotificationsProcessor', () => {
  let processor: NotificationsProcessor;

  type NotificationCreate = PrismaService['notification']['create'];

  const prismaMock = {
    notification: {
      create: jest.fn<
        ReturnType<NotificationCreate>,
        Parameters<NotificationCreate>
      >(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsProcessor,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    processor = module.get<NotificationsProcessor>(NotificationsProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should persist a status-change notification', async () => {
    const job = makeJob('status-change', {
      outboxEventId: 'outbox-123',
      applicationId: 'application-123',
      company: 'Acme',
      role: 'Full Stack Developer',
      fromStatus: ApplicationStatus.APPLIED,
      toStatus: ApplicationStatus.INTERVIEW,
    });

    prismaMock.notification.create.mockResolvedValue({
      id: 'outbox-123',
      applicationId: 'application-123',
    });

    await processor.process(job);

    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: {
        id: 'outbox-123',
        applicationId: 'application-123',
        type: 'STATUS_CHANGE',
        payload: {
          company: 'Acme',
          role: 'Full Stack Developer',
          fromStatus: ApplicationStatus.APPLIED,
          toStatus: ApplicationStatus.INTERVIEW,
        },
      },
    });
  });

  it('should handle duplicate outbox events without creating duplicate notifications', async () => {
    const job = makeJob('status-change', {
      outboxEventId: 'outbox-123',
      applicationId: 'application-123',
      company: 'Acme',
      role: 'Full Stack Developer',
      fromStatus: ApplicationStatus.APPLIED,
      toStatus: ApplicationStatus.INTERVIEW,
    });

    prismaMock.notification.create
      .mockResolvedValueOnce({
        id: 'outbox-123',
        applicationId: 'application-123',
      })
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

    await expect(processor.process(job)).resolves.toBeUndefined();
    await expect(processor.process(job)).resolves.toBeUndefined();

    expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);
  });

  it('should not fail when the job is unknown', async () => {
    const job = makeJob('unknown-job', {});

    await expect(processor.process(job)).resolves.toBeUndefined();
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });
  it('should reject status-change jobs with missing required identifiers', async () => {
    const job = makeJob('status-change', {
      company: 'Acme',
      role: 'Full Stack Developer',
      fromStatus: ApplicationStatus.APPLIED,
      toStatus: ApplicationStatus.INTERVIEW,
    });

    await expect(processor.process(job)).rejects.toThrow(
      'Invalid status-change job payload',
    );

    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });
  it('should propagate persistence errors other than duplicate errors', async () => {
    const job = makeJob('status-change', {
      outboxEventId: 'outbox-456',
      applicationId: 'application-456',
      company: 'Acme',
      role: 'Backend Developer',
      fromStatus: ApplicationStatus.APPLIED,
      toStatus: ApplicationStatus.INTERVIEW,
    });

    const databaseError = new Error('Database connection failed');

    prismaMock.notification.create.mockRejectedValueOnce(databaseError);

    await expect(processor.process(job)).rejects.toThrow(
      'Database connection failed',
    );

    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
  });
});
