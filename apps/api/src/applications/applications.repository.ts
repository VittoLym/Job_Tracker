
import { Injectable } from '@nestjs/common';
import {
  ApplicationStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: ApplicationStatus) {
    return this.prisma.application.findMany({
      where: status ? { status } : undefined,
      include: { statusHistory: true },
      orderBy: { appliedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.application.findUnique({
      where: { id },
      include: { statusHistory: true, notifications: true },
    });
  }

  create(dto: CreateApplicationDto) {
    return this.prisma.application.create({
      data: {
        ...dto,
        statusHistory: {
          create: {
            toStatus: dto.status ?? ApplicationStatus.APPLIED,
          },
        },
      },
      include: { statusHistory: true },
    });
  }

  async update(id: string, dto: UpdateApplicationDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const current = await tx.application.findUniqueOrThrow({
          where: { id },
        });

        const statusChanged =
          dto.status !== undefined &&
          dto.status !== current.status;

        const updated = await tx.application.update({
          where: { id },
          data: {
            ...dto,
            ...(statusChanged
              ? {
                  statusHistory: {
                    create: {
                      fromStatus: current.status,
                      toStatus: dto.status!,
                    },
                  },
                }
              : {}),
          },
          include: { statusHistory: true },
        });

        if (statusChanged) {
          const payload = {
            applicationId: updated.id,
            company: updated.company,
            role: updated.role,
            fromStatus: current.status,
            toStatus: updated.status,
          };

          await tx.outboxEvent.create({
            data: {
              aggregateType: 'Application',
              aggregateId: updated.id,
              eventType: 'APPLICATION_STATUS_CHANGED',
              payload,
            },
          });
        }

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  delete(id: string) {
    return this.prisma.application.delete({
      where: { id },
    });
  }
}
