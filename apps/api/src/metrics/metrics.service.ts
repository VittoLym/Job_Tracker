import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('applications_created_total')
    private readonly applicationsCreated: Counter<string>,

    @InjectMetric('applications_status_changes_total')
    private readonly statusChanges: Counter<string>,

    @InjectMetric('http_request_duration_ms')
    private readonly httpDuration: Histogram<string>,
  ) {}

  incrementApplicationsCreated() {
    this.applicationsCreated.inc();
  }

  incrementStatusChange(fromStatus: string, toStatus: string) {
    this.statusChanges.inc({ from_status: fromStatus, to_status: toStatus });
  }

  observeHttpDuration(method: string, route: string, statusCode: number, duration: number) {
    this.httpDuration.observe({ method, route, status_code: String(statusCode) }, duration);
  }
}
