
import { randomUUID } from 'crypto';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsRepository } from './applications.repository';

describe('ApplicationsRepository - Gmail idempotency', () => {
  const prisma = new PrismaService();
  const repository = new ApplicationsRepository(prisma);

  const gmailMessageId = `test-${randomUUID()}`;
  const company = `Test Company ${randomUUID()}`;

  let applicationId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const application = await prisma.application.create({
      data: {
        company,
        role: 'Backend Developer',
        status: ApplicationStatus.APPLIED,
      },
    });

    applicationId = application.id;
  });

  afterAll(async () => {
    if (applicationId) {
      await prisma.outboxEvent.deleteMany({
        where: { aggregateId: applicationId },
      });

      await prisma.gmailProcessedMessage.deleteMany({
        where: { gmailMessageId },
      });

      await prisma.application.delete({
        where: { id: applicationId },
      });
    }

    await prisma.$disconnect();
  });

  it('should process a Gmail message only once', async () => {
    const input = {
      gmailMessageId,
      historyId: 'test-history-123',
      detectedStatus: ApplicationStatus.INTERVIEW,
      companyHint: company,
      role: null,
      shouldCreate: false,
      urlJob: null,
    };

    const firstResult = await repository.processGmailMessage(input);
    const secondResult = await repository.processGmailMessage(input);

    expect(firstResult.duplicate).toBe(false);
    expect(firstResult.result).toBe('STATUS_UPDATED');

    expect(secondResult.duplicate).toBe(true);

    const application = await prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
    });

    expect(application.status).toBe(ApplicationStatus.INTERVIEW);

    const historyCount = await prisma.statusHistory.count({
      where: {
        applicationId,
        toStatus: ApplicationStatus.INTERVIEW,
      },
    });

    const outboxCount = await prisma.outboxEvent.count({
      where: {
        aggregateId: applicationId,
        eventType: 'APPLICATION_STATUS_CHANGED',
      },
    });

    const processedCount = await prisma.gmailProcessedMessage.count({
      where: { gmailMessageId },
    });

    expect(historyCount).toBe(1);
    expect(outboxCount).toBe(1);
    expect(processedCount).toBe(1);
  });
});
