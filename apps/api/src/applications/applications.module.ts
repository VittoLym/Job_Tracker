import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [NotificationsModule, MetricsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
})
export class ApplicationsModule {}
