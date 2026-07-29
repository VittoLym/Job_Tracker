import { Injectable } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';

interface ParsedEmail {
  detectedStatus: ApplicationStatus | null;
  companyHint: string | null;
  role: string | null;
  shouldCreate: boolean;
  urlJob: string | null;
}

@Injectable()
export class EmailParserService {
  parse(from: string, subject: string, snippet: string, body: string): ParsedEmail {
    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();
    const snippetLower = snippet.toLowerCase();
    const full = `${subjectLower} ${snippetLower}`;

    // NUEVA POSTULACIÓN — LinkedIn confirma solicitud enviada
    if (
      fromLower.includes('linkedin') &&
      (subjectLower.includes('se ha enviado tu solicitud') ||
        subjectLower.includes('your application was sent') ||
        subjectLower.includes('solicitud a') ||
        subjectLower.includes('application to'))
    ) {
      const company = this.extractCompanyFromSubject(subject);
      const role = this.extractRoleFromSnippet(body);
      console.log(role, 'este el rol amigo');
      return { detectedStatus: 'APPLIED', companyHint: company, role, shouldCreate: true, urlJob: this.extractJobUrl(body) };
    }

    // OFFER
    if (
      full.includes('nos complace ofrecerte') ||
      full.includes('pleased to offer') ||
      full.includes('oferta de trabajo') ||
      full.includes('job offer') ||
      full.includes('we would like to offer')
    ) {
      return { detectedStatus: 'OFFER', companyHint: this.extractCompany(from, subject), role: null, shouldCreate: false, urlJob: null };
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
      return { detectedStatus: 'REJECTED', companyHint: this.extractCompany(from, subject), role: null, shouldCreate: false, urlJob: null };
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
      return { detectedStatus: 'INTERVIEW', companyHint: this.extractCompany(from, subject), role: null, shouldCreate: false, urlJob: null };
    }

    // ASSESSMENT
    if (
      full.includes('assessment') ||
      full.includes('prueba técnica') ||
      full.includes('technical test') ||
      full.includes('challenge') ||
      full.includes('desafío')
    ) {
      return { detectedStatus: 'ASSESSMENT', companyHint: this.extractCompany(from, subject), role: null, shouldCreate: false, urlJob: null };
    }

    return { detectedStatus: null, companyHint: null, role: null, shouldCreate: false, urlJob: null };
  }

  private extractCompanyFromSubject(subject: string): string | null {
    // "Se ha enviado tu solicitud a PedidosYa"
    const esMatch = subject.match(/solicitud a\s+(.+?)$/i);
    if (esMatch?.[1]) return esMatch[1].trim();

    // "Your application was sent to Stripe"
    const enMatch = subject.match(/sent to\s+(.+?)$/i);
    if (enMatch?.[1]) return enMatch[1].trim();

    return null;
  }

  private extractCompany(from: string, subject: string): string | null {
    const linkedinPatterns = [
      /en\s+(.+?)\s+(fue|ha|está)/i,
      /at\s+(.+?)\s+(has|is|was)/i,
      /from\s+(.+?)[\s,]/i,
    ];

    for (const pattern of linkedinPatterns) {
      const match = subject.match(pattern);
      if (match?.[1]) return match[1].trim();
    }

    const fromName = from.match(/^([^<@]+)/)?.[1]?.trim();
    if (fromName && !['noreply', 'jobs', 'no-reply', 'notifications'].some(w => fromName.toLowerCase().includes(w))) {
      return fromName;
    }

    return null;
  }
  private extractRoleFromSnippet(body: string): string | null {
    const lines = body
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);

    const sentIndex = lines.findIndex(l =>
      l.includes('Se ha enviado tu solicitud a'),
    );

    if (sentIndex === -1) {
      return null;
    }

    const company = lines[sentIndex]
      .replace('Se ha enviado tu solicitud a', '')
      .replace('.', '')
      .trim();

    const role = lines[sentIndex + 1] || null;
    return role;
  }
  private extractJobUrl(body: string): string | null {
    const match = body.match(
      /https:\/\/www\.linkedin\.com\/comm\/jobs\/view\/[^\s]+/,
    );

    return match?.[0] ?? null;
  }
}
