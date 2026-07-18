import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from '../dto/create-application.dto';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {}