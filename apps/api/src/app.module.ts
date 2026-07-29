import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ApplicationsModule } from './applications/applications.module';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from './notifications/notifications.module';
import { LoggerModule } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HealthModule } from './health/health.module';
import 'dotenv/config';
import { GmailModule } from './gmail/gmail.module';
import { GmailService } from './gmail/gmail.service';
import { WebhooksModule } from './webhooks/webhooks.module';
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: () => uuidv4(),
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              }
            : undefined,
        customProps: (req) => ({
          correlationId: req.id,
        }),
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    PrismaModule,
    ApplicationsModule,
    NotificationsModule,
    HealthModule,
    GmailModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly gmailService: GmailService) {}

  async onModuleInit() {
    try {
      await this.gmailService.watchInbox();
    } catch (err) {
      console.error('Error activando Gmail watch:', err);
    }
  }
}
