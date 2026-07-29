import { Controller, Get, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { google } from 'googleapis';
import { AppService } from './app.service';
import 'dotenv/config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    return this.appService.getHello();
  }
  @Get('auth/google')
  googleAuth(@Res() res: Response) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent',
    });
    res.redirect(url);
  }

  @Get('auth/google/callback')
  async googleCallback(@Query('code') code: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const { tokens } = await oauth2Client.getToken(code);

    return {
      refresh_token: tokens.refresh_token,
      message: 'Copiá el refresh_token y pegalo en el .env',
    };
  }
}
