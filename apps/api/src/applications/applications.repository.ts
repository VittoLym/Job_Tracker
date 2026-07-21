import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus } from '@prisma/client';

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
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({ where: { id } });

      return tx.application.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.status && dto.status !== current?.status
            ? {
                statusHistory: {
                  create: {
                    fromStatus: current?.status,
                    toStatus: dto.status,
                  },
                },
              }
            : {}),
        },
        include: { statusHistory: true },
      });
    });
  }

  delete(id: string) {
    return this.prisma.application.delete({ where: { id } });
  }
}
