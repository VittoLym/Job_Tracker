import type { ApplicationStatus } from '../types';

export interface StatusConfig {
  label: string;
  color: string;
  dotColor?: string;
}

export const statusConfig: Record<ApplicationStatus, StatusConfig> = {
  APPLIED: { label: 'Applied', color: '#4f46e5', dotColor: '#4f46e5' },
  ASSESSMENT: { label: 'Assessment', color: '#f59e0b', dotColor: '#f59e0b' },
  INTERVIEW: { label: 'Interview', color: '#3b82f6', dotColor: '#3b82f6' },
  OFFER: { label: 'Offer', color: '#10b981', dotColor: '#10b981' },
  REJECTED: { label: 'Rejected', color: '#ef4444', dotColor: '#ef4444' },
  GHOSTED: { label: 'Ghosted', color: '#6b7280', dotColor: '#6b7280' },
};