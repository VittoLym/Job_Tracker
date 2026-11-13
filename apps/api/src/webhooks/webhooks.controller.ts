
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
      const applications = await this.applicationsService.findAll();

      for (const email of batch.messages) {
        const {
          from,
          subject,
          snippet,
          body: emailBody,
        } = email;

        const {
          detectedStatus,
          companyHint,
          role,
          shouldCreate,
          urlJob,
        } = this.parser.parse(from, subject, snippet, emailBody);

        if (!detectedStatus || !companyHint) continue;

        const normalizedHint = companyHint.trim().toLowerCase();

        const match = applications.find(
          (app) => app.company.trim().toLowerCase() === normalizedHint,
        );

        if (!match && shouldCreate) {
          const created = await this.applicationsService.create({
            company: companyHint,
            role: role ?? 'No especificado',
            status: ApplicationStatus.APPLIED,
            workMode: WorkMode.REMOTE,
            notes: 'Creado automáticamente desde LinkedIn',
            ...(urlJob ? { url: urlJob } : {}),
          });

          // Evita duplicados dentro del lote actual.
          applications.push(created);

          continue;
        }

        if (!match) {
          this.logger.warn('No se encontró coincidencia para una empresa');
          continue;
        }

        if (match.status === detectedStatus) continue;

        const updated = await this.applicationsService.update(match.id, {
          status: detectedStatus,
        });

        // Mantiene el estado local sincronizado con la base de datos.
        if(updated == undefined || updated == null) return
        match.status = updated.status;
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
