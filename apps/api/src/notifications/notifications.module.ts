import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProcessor } from './notifications.processor';
import { OutboxDispatcherService } from './outbox-dispatcher.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [NotificationsProcessor, OutboxDispatcherService],
})
export class NotificationsModule {}