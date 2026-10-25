import { EmailParserService } from './email-parser.service';

describe('EmailParserService', () => {
  let parser: EmailParserService;

  const NO_MATCH = {
    detectedStatus: null,
    companyHint: null,
    role: null,
    shouldCreate: false,
    urlJob: null,
  };

  beforeEach(() => {
    // The parser still logs the role with console.log
    jest.spyOn(console, 'log').mockImplementation();
    parser = new EmailParserService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ------------------------------------------- new applications (LinkedIn)
  describe('new applications confirmed by LinkedIn', () => {
    const FROM = 'LinkedIn <jobs-noreply@linkedin.com>';
    const JOB_URL = 'https://www.linkedin.com/comm/jobs/view/123456?trk=abc&x=1';

    it('detects a Spanish confirmation with company, role and job url', () => {
      const body = [
        'Se ha enviado tu solicitud a PedidosYa.',
        'Backend Developer',
        'PedidosYa · Buenos Aires',
        JOB_URL,
      ].join('\n');

      const result = parser.parse(
        FROM,
        'Se ha enviado tu solicitud a PedidosYa',
        'Se ha enviado tu solicitud a PedidosYa',
        body,
      );

      expect(result).toEqual({
        detectedStatus: 'APPLIED',
        companyHint: 'PedidosYa',
        role: 'Backend Developer',
        shouldCreate: true,
        urlJob: JOB_URL,
      });
    });

    it('detects an English confirmation and extracts the company', () => {
      const result = parser.parse(
        FROM,
        'Your application was sent to Stripe',
        'Your application was sent to Stripe',
        'Your application was sent to Stripe\nhttps://www.linkedin.com/comm/jobs/view/999',
      );

      expect(result.detectedStatus).toBe('APPLIED');
      expect(result.companyHint).toBe('Stripe');
      expect(result.shouldCreate).toBe(true);
      expect(result.urlJob).toBe('https://www.linkedin.com/comm/jobs/view/999');
    });

    it('reads the role from a body that uses CRLF line endings', () => {
      const body =
        'Se ha enviado tu solicitud a PedidosYa.\r\nBackend Developer\r\nPedidosYa\r\n';

      const result = parser.parse(
        FROM,
        'Se ha enviado tu solicitud a PedidosYa',
        '',
        body,
      );

      expect(result.role).toBe('Backend Developer');
    });

    it('still reports the application when the role cannot be found', () => {
      const result = parser.parse(
        FROM,
        'Se ha enviado tu solicitud a PedidosYa',
        '',
        'Contenido sin el texto esperado',
      );

      expect(result.detectedStatus).toBe('APPLIED');
      expect(result.companyHint).toBe('PedidosYa');
      expect(result.role).toBeNull();
    });

    it('returns no role when the marker line is the last line of the body', () => {
      const result = parser.parse(
        FROM,
        'Se ha enviado tu solicitud a PedidosYa',
        '',
        'Se ha enviado tu solicitud a PedidosYa.',
      );

      expect(result.role).toBeNull();
    });

    it('returns no job url when the body has no LinkedIn job link', () => {
      const result = parser.parse(
        FROM,
        'Se ha enviado tu solicitud a PedidosYa',
        '',
        'Se ha enviado tu solicitud a PedidosYa.\nBackend Developer',
      );

      expect(result.urlJob).toBeNull();
    });

    it('ignores the same subject when it does not come from LinkedIn', () => {
      const result = parser.parse(
        'Acme HR <hr@acme.com>',
        'Application to Acme',
        'Thanks for applying',
        '',
      );

      expect(result).toEqual(NO_MATCH);
    });

    // Feature gap: only the Spanish marker line is understood
    it.failing('extracts the role from an English LinkedIn confirmation', () => {
      const result = parser.parse(
        FROM,
        'Your application was sent to Stripe',
        '',
        'Your application was sent to Stripe\nBackend Engineer\nStripe',
      );

      expect(result.role).toBe('Backend Engineer');
    });

    it.todo(
      'does not treat LinkedIn status updates that contain "solicitud a" as new applications',
    );
  });

  // ------------------------------------------------------ status detection
  describe('status detection', () => {
    it.each([
      ['an offer (Spanish)', 'Acme <talent@acme.com>', 'Novedades', 'Nos complace ofrecerte el puesto', 'OFFER'],
      ['an offer (English)', 'Acme <talent@acme.com>', 'Job offer', 'We would like to offer you the position', 'OFFER'],
      ['a rejection (Spanish)', 'Acme <talent@acme.com>', 'Tu postulación', 'Lamentamos informarte que no continuaremos con tu proceso', 'REJECTED'],
      ['a rejection (English)', 'Acme <talent@acme.com>', 'Your application', 'Unfortunately we will not be moving forward', 'REJECTED'],
      ['an interview (Spanish)', 'Acme <talent@acme.com>', 'Invitación a entrevista', 'Nos gustaría conocerte', 'INTERVIEW'],
      ['an interview (English)', 'Acme <talent@acme.com>', 'Next step', 'We would like to schedule a call', 'INTERVIEW'],
      ['an assessment (Spanish)', 'Acme <talent@acme.com>', 'Prueba técnica', 'Te enviamos la consigna', 'ASSESSMENT'],
      ['an assessment (English)', 'Acme <talent@acme.com>', 'Technical test', 'Please complete it this week', 'ASSESSMENT'],
    ])('detects %s', (_label, from, subject, snippet, expected) => {
      const result = parser.parse(from, subject, snippet, '');

      expect(result.detectedStatus).toBe(expected);
    });

    it('only reports a status, never a new application or job data', () => {
      const result = parser.parse(
        'Acme <talent@acme.com>',
        'Job offer',
        'We would like to offer you the position',
        '',
      );

      expect(result.shouldCreate).toBe(false);
      expect(result.role).toBeNull();
      expect(result.urlJob).toBeNull();
    });

    it('is case-insensitive', () => {
      const result = parser.parse('Acme <talent@acme.com>', 'JOB OFFER', 'WE WOULD LIKE TO OFFER YOU THE POSITION', '');

      expect(result.detectedStatus).toBe('OFFER');
    });

    it('prefers a rejection over an interview mention in the same email', () => {
      const result = parser.parse(
        'Acme HR <hr@acme.com>',
        'Update on your application',
        'Thanks for the interview. Unfortunately we will not be moving forward',
        '',
      );

      expect(result.detectedStatus).toBe('REJECTED');
    });

    it('prefers an offer over an interview mention in the same email', () => {
      const result = parser.parse(
        'Acme <talent@acme.com>',
        'Update',
        'We would like to offer you the position. Let us schedule a call',
        '',
      );

      expect(result.detectedStatus).toBe('OFFER');
    });

    it('returns no match for an unrelated email', () => {
      const result = parser.parse('Newsletter <news@example.com>', 'Weekly digest', 'Top stories this week', '');

      expect(result).toEqual(NO_MATCH);
    });

    it('decides from the subject and snippet only, not from the body', () => {
      const result = parser.parse(
        'Newsletter <news@example.com>',
        'Weekly digest',
        'Top stories this week',
        'We would like to offer you the position',
      );

      expect(result).toEqual(NO_MATCH);
    });
  });

  // ------------------------------------------------------- company hint
  describe('company hint', () => {
    it('reads the company from a Spanish subject', () => {
      const result = parser.parse(
        'Acme <talent@acme.com>',
        'Tu postulación en Globant ha sido actualizada',
        'Lamentamos informarte que no continuaremos con tu proceso',
        '',
      );

      expect(result.companyHint).toBe('Globant');
    });

    it('reads the company from an English subject', () => {
      const result = parser.parse(
        'Recruiting <jobs@stripe.com>',
        'Your application at Stripe has been updated',
        'Unfortunately we will not be moving forward',
        '',
      );

      expect(result.companyHint).toBe('Stripe');
    });

    it('falls back to the sender display name', () => {
      const result = parser.parse(
        'Mercado Libre <people@mercadolibre.com>',
        'Invitación a entrevista',
        'Nos gustaría conocerte',
        '',
      );

      expect(result.companyHint).toBe('Mercado Libre');
    });

    it('returns no company when the sender name is generic and the subject has no hint', () => {
      const result = parser.parse(
        'Jobs <jobs@example.com>',
        'Invitación a entrevista',
        'Nos gustaría conocerte',
        '',
      );

      expect(result.detectedStatus).toBe('INTERVIEW');
      expect(result.companyHint).toBeNull();
    });

    // The sender display name often carries a department: the company is
    // "Acme", not "Acme Talent". The webhook compensates with a loose
    // substring match, which is where wrong matches come from.
    [
      ['Acme Talent <talent@acme.com>', 'Acme'],
      ['Globant Talent <talent@globant.com>', 'Globant'],
      ['Stripe Recruiting <jobs@stripe.com>', 'Stripe'],
      ['Acme HR <hr@acme.com>', 'Acme'],
    ].forEach(([from, company]) => {
      it.failing(`strips the department from the sender name "${from}"`, () => {
        const result = parser.parse(
          from,
          'Invitación a entrevista',
          'Nos gustaría conocerte',
          '',
        );

        expect(result.companyHint).toBe(company);
      });
    });
  });

  // -------------------------------------------------- known false positives
  // Every email in the inbox goes through the parser, so keywords that are
  // too broad update real applications from unrelated emails.
  describe('known false positives', () => {
    it.failing('ignores a newsletter that only mentions interviews', () => {
      const result = parser.parse(
        'Medium Daily Digest <noreply@medium.com>',
        '5 interview questions every backend dev should know',
        'Prepare for your next interview',
        '',
      );

      expect(result.detectedStatus).toBeNull();
    });

    it.failing('ignores a coding challenge advertisement', () => {
      const result = parser.parse(
        'Dev Weekly <hello@devweekly.com>',
        'Join the 30 day coding challenge',
        'Sign up today',
        '',
      );

      expect(result.detectedStatus).toBeNull();
    });

    it.failing('ignores a rejected pull request notification', () => {
      const result = parser.parse(
        'GitHub <notifications@github.com>',
        'Your pull request was rejected',
        'Review comments',
        '',
      );

      expect(result.detectedStatus).toBeNull();
    });
  });
});
