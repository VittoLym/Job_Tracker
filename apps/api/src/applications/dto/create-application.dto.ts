import {
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { ApplicationStatus, WorkMode } from '@prisma/client';
export class CreateApplicationDto {
  @IsString()
  company: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
