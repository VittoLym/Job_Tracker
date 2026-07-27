import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { EmailParserService } from './email-parser.service';

@Module({
  providers: [GmailService, EmailParserService],
  exports: [GmailService, EmailParserService],
})
export class GmailModule {}
