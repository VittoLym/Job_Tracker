
import {
  Controller,
  Post,
  Body,
  Logger,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { GmailService } from '../gmail/gmail.service';
import { EmailParserService } from '../gmail/email-parser.service';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationStatus, WorkMode } from '@prisma/client';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly gmailService: GmailService,
    private readonly parser: EmailParserService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  private isValidToken(token?: string): boolean {
    const expected = process.env.WEBHOOK_TOKEN;

    if (!expected || !token) return false;

    const a = Buffer.from(token);
    const b = Buffer.from(expected);

    return a.length === b.length && timingSafeEqual(a, b);
  }

  @Post('gmail')
  async handleGmailPush(
    @Body() body: any,
    @Query('token') token?: string,
  ) {
    if (!this.isValidToken(token)) {
      throw new UnauthorizedException();
    }
    const data = body?.message?.data;
    if (!data) {
      this.logger.warn('Webhook recibido sin message.data');
      return { ok: true };
    }
    try {
      const decoded = JSON.parse(
        Buffer.from(data, 'base64').toString('utf-8'),
      );
      const historyId = decoded.historyId?.toString();
      if (!historyId) {
        this.logger.warn('Notificación sin historyId');
        return { ok: true };
      }
      const batch = await this.gmailService.getNewMessages(historyId);
      for (const email of batch.messages) {
        const parsed = this.parser.parse(
          email.from,
          email.subject,
          email.snippet,
          email.body,
        );
        const result = await this.applicationsService.processGmailMessage({
          gmailMessageId: email.id,
          historyId: batch.historyId,
          ...parsed,
        });
        if(result == undefined) throw new Error
        if (result.duplicate) {
          this.logger.debug(`Mensaje ${email.id} ya procesado`);
          continue;
        }
        this.logger.log(
          `Mensaje ${email.id}: ${result.result} — ${result.reason}`,
        );
      }
      await this.gmailService.commitHistoryId(batch.historyId);
      return { ok: true };
    } catch (err) {
      this.logger.error(
        'Error procesando webhook de Gmail',
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }
}
