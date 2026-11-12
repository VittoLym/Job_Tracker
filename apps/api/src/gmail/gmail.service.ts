import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Redis } from 'ioredis';

type GmailMessage = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
};

type GmailSyncBatch = {
  messages: GmailMessage[];
  historyId: string;
};
@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly redis: Redis;
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
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
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    if (!topicName) {
      this.logger.warn('GMAIL_PUBSUB_TOPIC is not set, skipping Gmail watch');
      return;
    }

    const auth = this.getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
      },
    });
    const initialHistoryId = res.data.historyId?.toString();
    if (initialHistoryId) {
      const existingHistoryId = await this.redis.get(
        'gmail:lastHistoryId',
      );

      if (!existingHistoryId) {
        await this.redis.set(
          'gmail:lastHistoryId',
          initialHistoryId,
        );
      }
      this.logger.log('Gmail Watch activado correctamente')
    }
    else{
      this.logger.warn('No hay historyId guardado.');
    }
  }

  async getNewMessages(
    newHistoryId: string,
  ): Promise<GmailSyncBatch> {
    const auth = this.getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const lastHistoryId = await this.redis.get('gmail:lastHistoryId');

    if (!lastHistoryId) {
      throw new Error(
        'No existe lastHistoryId. Es necesario inicializar la sincronización.',
      );
    }

    this.logger.log(
      `Buscando history desde ${lastHistoryId} hasta ${newHistoryId}`,
    );

    const messageIds = new Set<string>();
    let pageToken: string | undefined;

    do {
      const response = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
        pageToken,
      });
      if(response.data.historyId != null && response.data.historyId < lastHistoryId){
        this.logger.warn('Mensaje ya analizado')
        throw new Error(
        'El mensaje ya ha sido trabajado.',
      );
      }
      for (const history of response.data.history ?? []) {
        for (const added of history.messagesAdded ?? []) {
          const id = added.message?.id;
          if (id) {
            messageIds.add(id);
          }
        }
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    this.logger.log(
      `Mensajes nuevos encontrados: ${messageIds.size}`,
    );
    const messages = await Promise.all(
      [...messageIds].map(async (id) => ({
        id,
        ...(await this.getMessage(id)),
      })),
    );

    return {
      messages,
      historyId: newHistoryId,
    };
  }

  async commitHistoryId(historyId: string): Promise<void> {
    await this.redis.set('gmail:lastHistoryId', historyId);

    this.logger.log(`HistoryId confirmado: ${historyId}`);
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
