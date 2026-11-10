import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class DemoReadOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.DEMO_MODE !== 'true') return true;

    const req = context.switchToHttp().getRequest<Request>();
    const readsApplications = req.method === 'GET' && req.path.startsWith('/applications');
    const isHealth = req.method === 'GET' && req.path === '/health';
    if (readsApplications || isHealth) return true;

    throw new ForbiddenException('Demo mode is read-only');
  }
}