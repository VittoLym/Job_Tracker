import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

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
        topicName: 'projects/TU_PROJECT_ID/topics/gmail-notifications',
        labelIds: ['INBOX'],
      },
    });

    this.logger.log(`Gmail watch activo hasta: ${new Date(Number(res.data.expiration)).toISOString()}`);
  }

  async getMessage(messageId: string): Promise<{ from: string; subject: string; snippet: string }> {
    const auth = this.getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject'],
    });

    const headers = msg.data.payload?.headers ?? [];
    const from = headers.find(h => h.name === 'From')?.value ?? '';
    const subject = headers.find(h => h.name === 'Subject')?.value ?? '';
    const snippet = msg.data.snippet ?? '';

    return { from, subject, snippet };
  }
}