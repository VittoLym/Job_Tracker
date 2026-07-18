import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private readonly repo: ApplicationsRepository) {}

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
    await this.findOne(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
