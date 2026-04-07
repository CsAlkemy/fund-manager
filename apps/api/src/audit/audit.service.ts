import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(actorId: string, groupId: string | null, action: string, entity: string, entityId: string, details?: Record<string, any>): Promise<any> {
    return this.prisma.auditLog.create({
      data: { actorId, groupId, action, entity, entityId, details },
    });
  }

  async getGroupLogs(groupId: string, page = 1, limit = 50): Promise<{ logs: any[]; total: number; page: number; limit: number }> {
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { groupId },
        include: { actor: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { groupId } }),
    ]);

    return { logs, total, page, limit };
  }
}
