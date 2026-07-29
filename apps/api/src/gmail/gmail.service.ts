import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Redis } from 'ioredis';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly redis: Redis;
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }
  private getOAuthClient() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    return oauth2Client;
  }
  async watchInbox(): Promise<void> {
    const auth = this.getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: 'projects/eighth-arbor-459517-q9/topics/gmail-notifications',
        labelIds: ['INBOX'],
      },
    });
    const initialHistoryId = res.data.historyId?.toString();
    if (initialHistoryId) {
      await this.redis.set('gmail:lastHistoryId', initialHistoryId);
      this.logger.log(`Gmail watch activo hasta: ${new Date(Number(res.data.expiration)).toISOString()}`);
    }
  }

  async getNewMessages(newHistoryId: string): Promise<{ from: string; subject: string; snippet: string; body: string }[]> {
    const auth = this.getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    try {
      const lastHistoryId = await this.redis.get('gmail:lastHistoryId');

      if (!lastHistoryId) {
        this.logger.warn('No hay historyId guardado, guardando el actual');
        await this.redis.set('gmail:lastHistoryId', newHistoryId);
        return [];
      }

      this.logger.log(`Buscando history desde ${lastHistoryId} hasta ${newHistoryId}`);

      const history = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
      });

      await this.redis.set('gmail:lastHistoryId', newHistoryId);

      const messages = history.data.history?.flatMap(h => h.messagesAdded ?? []) ?? [];
      this.logger.log(`Mensajes nuevos encontrados: ${messages.length}`);

      const results = await Promise.all(
        messages
          .filter(m => m.message?.id)
          .map(m => this.getMessage(m.message!.id!))
      );

      return results;
    } catch (err) {
      this.logger.warn(`Error obteniendo history: ${err?.message}`);
      await this.redis.set('gmail:lastHistoryId', newHistoryId);
      return [];
    }
  }

  async getMessage(messageId: string): Promise<{ from: string; subject: string; body: string, snippet: string }> {
    const auth = this.getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const headers = msg.data.payload?.headers ?? [];
    const from = headers.find(h => h.name === 'From')?.value ?? '';
    const subject = headers.find(h => h.name === 'Subject')?.value ?? '';
    const snippet = msg.data.snippet ?? '';

    // Extraer texto del body
    const body = this.extractBody(msg.data.payload);

    return { from, subject, body, snippet };
  }

  private extractBody(payload: any): string {
    if (!payload) return '';

    // Si tiene parts (multipart)
    if (payload.parts) {
      for (const part of payload.parts) {
        // Buscar text/plain primero
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        // Recursivo para partes anidadas
        if (part.parts) {
          const nested = this.extractBody(part);
          if (nested) return nested;
        }
      }
      // Fallback a text/html si no hay plain
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          // Strip HTML tags básico
          return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }

    // Si el body está directo en el payload
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return '';
  }
}
