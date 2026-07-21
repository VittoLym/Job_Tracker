import { Module } from '@nestjs/common';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Module({
  providers: [
    MetricsService,
    makeCounterProvider({
      name: 'applications_created_total',
      help: 'Total number of job applications created',
    }),
    makeCounterProvider({
      name: 'applications_status_changes_total',
      help: 'Total number of status changes',
      labelNames: ['from_status', 'to_status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [10, 50, 100, 200, 500, 1000],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
