import { Controller, Post, Body, Logger } from '@nestjs/common';
import { GmailService } from '../gmail/gmail.service';
import { EmailParserService } from '../gmail/email-parser.service';
import { ApplicationsRepository } from '../applications/applications.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly gmailService: GmailService,
    private readonly parser: EmailParserService,
    private readonly applicationsRepo: ApplicationsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  @Post('gmail')
  async handleGmailPush(@Body() body: any) {
    try {
      // Google manda el mensaje en base64
      const data = body?.message?.data;
      if (!data) return { ok: true };

      const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      const messageId = decoded.emailAddress; // solo nos avisa que hay algo nuevo

      // Obtenemos los últimos mensajes
      const { from, subject, snippet } = await this.gmailService.getMessage(decoded.historyId ?? '');

      this.logger.log(`Email recibido de: ${from} | Asunto: ${subject}`);

      // Parseamos
      const { detectedStatus, companyHint } = this.parser.parse(from, subject, snippet);

      if (!detectedStatus || !companyHint) {
        this.logger.log('Email no relevante, ignorando');
        return { ok: true };
      }

      // Buscamos la application que matchea
      const applications = await this.applicationsRepo.findAll();
      const match = applications.find(app =>
        app.company.toLowerCase().includes(companyHint.toLowerCase()) ||
        companyHint.toLowerCase().includes(app.company.toLowerCase())
      );

      if (!match) {
        this.logger.warn(`No se encontró application para: ${companyHint}`);
        return { ok: true };
      }

      if (match.status === detectedStatus) {
        this.logger.log(`Application ya tiene status ${detectedStatus}, ignorando`);
        return { ok: true };
      }

      // Actualizamos el status
      await this.applicationsRepo.update(match.id, { status: detectedStatus });

      await this.notifications.notifyStatusChange({
        applicationId: match.id,
        company: match.company,
        role: match.role,
        fromStatus: match.status,
        toStatus: detectedStatus,
      });

      this.logger.log(`✅ ${match.company} actualizado: ${match.status} → ${detectedStatus}`);

      return { ok: true };
    } catch (err) {
      this.logger.error('Error procesando webhook de Gmail', err);
      return { ok: true }; // siempre 200 para que Google no reintente
    }
  }
}
