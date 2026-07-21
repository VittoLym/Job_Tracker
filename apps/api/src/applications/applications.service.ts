import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly repo: ApplicationsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(status?: ApplicationStatus) {
    return this.repo.findAll(status);
  }

  async findOne(id: string) {
    const app = await this.repo.findOne(id);
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return app;
  }

  create(dto: CreateApplicationDto) {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateApplicationDto) {
    const current = await this.findOne(id);
    const updated = await this.repo.update(id, dto);

    if (dto.status && dto.status !== current.status) {
      await this.notifications.notifyStatusChange({
        applicationId: id,
        company: updated.company,
        role: updated.role,
        fromStatus: current.status,
        toStatus: dto.status,
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
