import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { MetricsService } from '../metrics/metrics.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ProcessGmailMessageInput } from './applications.repository';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly repo: ApplicationsRepository,
    private readonly notifications: NotificationsService,
    private readonly metrics: MetricsService,
  ) {}

  findAll(status?: ApplicationStatus) {
    return this.repo.findAll(status);
  }
  async processGmailMessage(input: ProcessGmailMessageInput) {
    return this.repo.processGmailMessage(input);
  }
  async findOne(id: string) {
    const app = await this.repo.findOne(id);
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return app;
  }
  async create(dto: CreateApplicationDto) {
    const app = await this.repo.create(dto);
    this.metrics.incrementApplicationsCreated();
    return app;
  }

  async update(id: string, dto: UpdateApplicationDto) {
    const current = await this.findOne(id);
    const updated = await this.repo.update(id, dto);

    if (dto.status !== undefined && dto.status !== current.status) {
      this.metrics.incrementStatusChange(current.status, updated.status);
    }

    return updated;
  }
  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
