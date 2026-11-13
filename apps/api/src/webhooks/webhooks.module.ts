import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { GmailModule } from '../gmail/gmail.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [GmailModule, ApplicationsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
