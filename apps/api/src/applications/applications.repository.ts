
import { Injectable } from '@nestjs/common';
import {
  GmailProcessingResult,
  WorkMode,
  ApplicationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
export interface ProcessGmailMessageInput {
  gmailMessageId: string;
  historyId: string;
  detectedStatus: ApplicationStatus | null;
  companyHint: string | null;
  role: string | null;
  shouldCreate: boolean;
  urlJob: string | null;
}
@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
  private isSerializationConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }
  findAll(status?: ApplicationStatus) {
    return this.prisma.application.findMany({
      where: status ? { status } : undefined,
      include: { statusHistory: true },
      orderBy: { appliedAt: 'desc' },
    });
  }
  findOne(id: string) {
    return this.prisma.application.findUnique({
      where: { id },
      include: { statusHistory: true, notifications: true },
    });
  }
  async processGmailMessage(input: ProcessGmailMessageInput) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Registrar primero el ID para bloquear duplicados.
            const processed = await tx.gmailProcessedMessage.create({
              data: {
                gmailMessageId: input.gmailMessageId,
                historyId: input.historyId,
                result: GmailProcessingResult.IGNORED,
                reason: 'Processing',
              },
            });

            const finish = async (
              result: GmailProcessingResult,
              reason: string,
            ) => {
              await tx.gmailProcessedMessage.update({
                where: { id: processed.id },
                data: { result, reason },
              });

              return { duplicate: false, result, reason };
            };

            if (!input.detectedStatus || !input.companyHint?.trim()) {
              return finish(
                GmailProcessingResult.IGNORED,
                'No se detectó estado o empresa',
              );
            }

            const normalizedHint = input.companyHint.trim().toLowerCase();

            const applications = await tx.application.findMany({
              select: {
                id: true,
                company: true,
                status: true,
              },
            });

            const match = applications.find(
              (app) => app.company.trim().toLowerCase() === normalizedHint,
            );

            // Nueva postulación.
            if (!match && input.shouldCreate) {
              await tx.application.create({
                data: {
                  company: input.companyHint.trim(),
                  role: input.role ?? 'No especificado',
                  status: ApplicationStatus.APPLIED,
                  workMode: WorkMode.REMOTE,
                  notes: 'Creado automáticamente desde LinkedIn',
                  ...(input.urlJob ? { url: input.urlJob } : {}),
                  statusHistory: {
                    create: {
                      toStatus: ApplicationStatus.APPLIED,
                    },
                  },
                },
              });

              return finish(
                GmailProcessingResult.CREATED_APPLICATION,
                'Postulación creada desde Gmail',
              );
            }

            if (!match) {
              return finish(
                GmailProcessingResult.NO_MATCH,
                'No se encontró una postulación coincidente',
              );
            }

            // El estado ya es el mismo.
            if (match.status === input.detectedStatus) {
              return finish(
                GmailProcessingResult.NO_CHANGE,
                'La postulación ya tenía ese estado',
              );
            }

            // Actualizar estado e historial.
            const updated = await tx.application.update({
              where: { id: match.id },
              data: {
                status: input.detectedStatus,
                statusHistory: {
                  create: {
                    fromStatus: match.status,
                    toStatus: input.detectedStatus,
                  },
                },
              },
            });

            // Registrar evento Outbox dentro de la misma transacción.
            await tx.outboxEvent.create({
              data: {
                aggregateType: 'Application',
                aggregateId: updated.id,
                eventType: 'APPLICATION_STATUS_CHANGED',
                payload: {
                  applicationId: updated.id,
                  company: updated.company,
                  role: updated.role,
                  fromStatus: match.status,
                  toStatus: updated.status,
                },
              },
            });

            return finish(
              GmailProcessingResult.STATUS_UPDATED,
              'Estado actualizado desde Gmail',
            );
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
          if (this.isUniqueConstraintError(error)) {
            const existingMessage =
              await this.prisma.gmailProcessedMessage.findUnique({
                where: {
                  gmailMessageId: input.gmailMessageId,
                },
                select: {
                  id: true,
                },
              });

            if (existingMessage) {
              return {
                duplicate: true,
                result: null,
                reason: 'Mensaje de Gmail ya procesado',
              };
            }
          }

          if (
            !this.isSerializationConflict(error) ||
            attempt === maxAttempts
          ) {
            throw error;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 50 * attempt),
          );
      }
    }
    throw new Error('No se pudo procesar el mensaje de Gmail');
  }
  create(dto: CreateApplicationDto) {
    return this.prisma.application.create({
      data: {
        ...dto,
        statusHistory: {
          create: {
            toStatus: dto.status ?? ApplicationStatus.APPLIED,
          },
        },
      },
      include: { statusHistory: true },
    });
  }
  async update(id: string, dto: UpdateApplicationDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const current = await tx.application.findUniqueOrThrow({
          where: { id },
        });

        const statusChanged =
          dto.status !== undefined &&
          dto.status !== current.status;

        const updated = await tx.application.update({
          where: { id },
          data: {
            ...dto,
            ...(statusChanged
              ? {
                  statusHistory: {
                    create: {
                      fromStatus: current.status,
                      toStatus: dto.status!,
                    },
                  },
                }
              : {}),
          },
          include: { statusHistory: true },
        });

        if (statusChanged) {
          const payload = {
            applicationId: updated.id,
            company: updated.company,
            role: updated.role,
            fromStatus: current.status,
            toStatus: updated.status,
          };

          await tx.outboxEvent.create({
            data: {
              aggregateType: 'Application',
              aggregateId: updated.id,
              eventType: 'APPLICATION_STATUS_CHANGED',
              payload,
            },
          });
        }

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  delete(id: string) {
    return this.prisma.application.delete({
      where: { id },
    });
  }
}
