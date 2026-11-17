import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        application: {
          select: {
            id: true,
            company: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }
}
