
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsProcessor } from './notifications.processor';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

describe('NotificationsProcessor', () => {
  let processor: NotificationsProcessor;

  const prismaMock = {
    notification: {
      create: jest.fn(),
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

    processor = module.get<NotificationsProcessor>(
      NotificationsProcessor,
    );
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should persist a status-change notification', async () => {
    const job = {
      name: 'status-change',
      data: {
        outboxEventId: 'outbox-123',
        applicationId: 'application-123',
        company: 'Acme',
        role: 'Full Stack Developer',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.INTERVIEW,
      },
    } as any;

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
    const job = {
      name: 'status-change',
      data: {
        outboxEventId: 'outbox-123',
        applicationId: 'application-123',
        company: 'Acme',
        role: 'Full Stack Developer',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.INTERVIEW,
      },
    } as any;

    prismaMock.notification.create
      .mockResolvedValueOnce({
        id: 'outbox-123',
        applicationId: 'application-123',
      })
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          {
            code: 'P2002',
            clientVersion: 'test',
          },
        ),
      );

    await expect(processor.process(job)).resolves.toBeUndefined();
    await expect(processor.process(job)).resolves.toBeUndefined();

    expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);
  });

  it('should not fail when the job is unknown', async () => {
    const job = {
      name: 'unknown-job',
      data: {},
    } as any;

    await expect(processor.process(job)).resolves.toBeUndefined();
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });
  it('should reject status-change jobs with missing required identifiers', async () => {
    const job = {
      name: 'status-change',
      data: {
        company: 'Acme',
        role: 'Full Stack Developer',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.INTERVIEW,
      },
    } as any;

    await expect(processor.process(job)).rejects.toThrow(
      'Invalid status-change job payload',
    );

    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });
  it('should propagate persistence errors other than duplicate errors', async () => {
    const job = {
      name: 'status-change',
      data: {
        outboxEventId: 'outbox-456',
        applicationId: 'application-456',
        company: 'Acme',
        role: 'Backend Developer',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.INTERVIEW,
      },
    } as any;

    const databaseError = new Error('Database connection failed');

    prismaMock.notification.create.mockRejectedValueOnce(databaseError);

    await expect(processor.process(job)).rejects.toThrow(
      'Database connection failed',
    );

    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
  });
});
