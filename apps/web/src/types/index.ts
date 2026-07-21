export type ApplicationStatus =
  | 'APPLIED'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'GHOSTED';

export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE';

export interface StatusHistory {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: string;
  note: string | null;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  url: string | null;
  status: ApplicationStatus;
  workMode: WorkMode | null;
  salary: number | null;
  notes: string | null;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistory[];
}

export interface CreateApplicationDto {
  company: string;
  role: string;
  url?: string;
  status?: ApplicationStatus;
  workMode?: WorkMode;
  salary?: number;
  notes?: string;
}

export interface UpdateApplicationDto extends Partial<CreateApplicationDto> {}