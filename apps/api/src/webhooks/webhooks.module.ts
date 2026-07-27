import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { GmailModule } from '../gmail/gmail.module';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [GmailModule, ApplicationsModule, NotificationsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
