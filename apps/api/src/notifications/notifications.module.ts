import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { OutboxDispatcherService } from './outbox-dispatcher.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [NotificationsService, NotificationsProcessor, OutboxDispatcherService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
