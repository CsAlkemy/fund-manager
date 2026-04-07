import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FineService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Calculate and apply fines for a group for a given month/year.
   * Called on-demand (e.g., by treasurer or cron) after the deadline day.
   * Fine is based on whether a PENDING or VERIFIED contribution exists
   * with submittedAt before the deadline.
   */
  async calculateFines(groupId: string, month: number, year: number) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return [];

    const deadline = new Date(year, month - 1, group.fineDeadlineDay, 23, 59, 59);
    const now = new Date();

    // Only calculate if we're past the deadline
    if (now <= deadline) return [];

    const members = await this.prisma.membership.findMany({
      where: { groupId, status: 'ACTIVE' },
    });

    const finesCreated = [];

    for (const member of members) {
      // Check if fine already exists
      const existingFine = await this.prisma.fine.findUnique({
        where: { userId_groupId_month_year: { userId: member.userId, groupId, month, year } },
      });
      if (existingFine) continue;

      // Check if contribution was submitted before deadline
      const contribution = await this.prisma.contribution.findFirst({
        where: {
          userId: member.userId,
          groupId,
          month,
          year,
          status: { in: ['PENDING', 'VERIFIED'] },
          submittedAt: { lte: deadline },
        },
      });

      // No timely contribution = fine
      if (!contribution) {
        const fine = await this.prisma.fine.create({
          data: {
            userId: member.userId,
            groupId,
            month,
            year,
            amount: group.fineAmount,
          },
        });
        finesCreated.push(fine);
      }
    }

    return finesCreated;
  }

  async waiveFine(actorId: string, fineId: string, reason: string) {
    const fine = await this.prisma.fine.update({
      where: { id: fineId },
      data: { status: 'WAIVED', waivedBy: actorId, waiveReason: reason },
    });

    await this.auditService.log(actorId, fine.groupId, 'WAIVE', 'Fine', fineId, { reason });
    return fine;
  }

  async getGroupFines(groupId: string, month?: number, year?: number) {
    const where: any = { groupId };
    if (month) where.month = month;
    if (year) where.year = year;

    return this.prisma.fine.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getUserFines(userId: string, groupId: string) {
    return this.prisma.fine.findMany({
      where: { userId, groupId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}
