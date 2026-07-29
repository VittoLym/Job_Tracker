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
    this.logger.log(`Body recibido: ${JSON.stringify(body)}`);
    try {
      const data = body?.message?.data;
      if (!data) return { ok: true };

      const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      this.logger.log(`Decoded: ${JSON.stringify(decoded)}`);

      const historyId = decoded.historyId?.toString();
      if (!historyId) return { ok: true };

      const messages = await this.gmailService.getNewMessages(historyId);

      for (const { from, subject, snippet, body } of messages) {
        this.logger.log(
          `Email: de= ${from} | asunto= ${subject} | snippet= ${snippet} | Body= ${body}`,
        );

        const { detectedStatus, companyHint, role, shouldCreate } = this.parser.parse(from, subject, snippet, body);

        if (!detectedStatus || !companyHint) {
          this.logger.log('Email no relevante, ignorando');
          continue;
        }

        const applications = await this.applicationsRepo.findAll();
        const match = applications!.find(app =>
            app.company.toLowerCase().includes(companyHint.toLowerCase()) ||
            companyHint.toLowerCase().includes(app.company.toLowerCase()),
        );

        // Crear si no existe y el email lo indica
        if (!match && shouldCreate) {
          await this.applicationsRepo.create({
            company: companyHint,
            role: role ?? 'No especificado',
            status: 'APPLIED',
            notes: 'Creado automáticamente desde LinkedIn',
          });
          this.logger.log(`✅ Nueva application creada automáticamente: ${companyHint} — ${role}`);
          continue;
        }

        if (!match) {
          this.logger.warn(`No se encontró application para: ${companyHint}`);
          continue;
        }

        if (match.status === detectedStatus) {
          this.logger.log(`Application ya tiene status ${detectedStatus}, ignorando`);
          continue;
        }

        await this.applicationsRepo.update(match.id, { status: detectedStatus });

        await this.notifications.notifyStatusChange({
          applicationId: match.id,
          company: match.company,
          role: match.role,
          fromStatus: match.status,
          toStatus: detectedStatus,
        });

        this.logger.log(`✅ ${match.company}: ${match.status} → ${detectedStatus}`);
      }

      return { ok: true };
    } catch (err) {
      this.logger.error('Error procesando webhook de Gmail', err?.message ?? err);
      return { ok: true };
    }
  }
}
