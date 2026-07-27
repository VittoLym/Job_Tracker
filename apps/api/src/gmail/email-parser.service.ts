import { Injectable } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';

interface ParsedEmail {
  detectedStatus: ApplicationStatus | null;
  companyHint: string | null;
}

@Injectable()
export class EmailParserService {
  parse(from: string, subject: string, snippet: string): ParsedEmail {
    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();
    const snippetLower = snippet.toLowerCase();
    const full = `${subjectLower} ${snippetLower}`;

    // OFFER
    if (
      full.includes('nos complace ofrecerte') ||
      full.includes('pleased to offer') ||
      full.includes('oferta de trabajo') ||
      full.includes('job offer') ||
      full.includes('we would like to offer')
    ) {
      return { detectedStatus: 'OFFER', companyHint: this.extractCompany(from, subject) };
    }

    // REJECTED
    if (
      full.includes('no continuaremos') ||
      full.includes('no hemos seleccionado') ||
      full.includes('we will not be moving forward') ||
      full.includes('not selected') ||
      full.includes('rejected') ||
      full.includes('unfortunately') ||
      full.includes('lamentamos') ||
      full.includes('we regret')
    ) {
      return { detectedStatus: 'REJECTED', companyHint: this.extractCompany(from, subject) };
    }

    // INTERVIEW
    if (
      full.includes('entrevista') ||
      full.includes('interview') ||
      full.includes('nos gustaría conocerte') ||
      full.includes('agendar una llamada') ||
      full.includes('schedule a call') ||
      full.includes('avanzaste') ||
      full.includes('next step') ||
      full.includes('siguiente paso')
    ) {
      return { detectedStatus: 'INTERVIEW', companyHint: this.extractCompany(from, subject) };
    }

    // ASSESSMENT
    if (
      full.includes('assessment') ||
      full.includes('prueba técnica') ||
      full.includes('technical test') ||
      full.includes('challenge') ||
      full.includes('desafío')
    ) {
      return { detectedStatus: 'ASSESSMENT', companyHint: this.extractCompany(from, subject) };
    }

    // GHOSTED — vio tu perfil pero no respondió (LinkedIn)
    if (
      fromLower.includes('linkedin') &&
      (full.includes('vio tu perfil') || full.includes('viewed your profile'))
    ) {
      return { detectedStatus: null, companyHint: null }; // no cambiamos status
    }

    return { detectedStatus: null, companyHint: null };
  }

  private extractCompany(from: string, subject: string): string | null {
    // Intentar extraer nombre de empresa del remitente
    const match = from.match(/^([^<@]+)/);
    if (match) return match[1].trim();
    return null;
  }
}
