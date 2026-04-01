import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContributionService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async submit(userId: string, data: {
    groupId: string;
    month: number;
    year: number;
    amount: number;
    paymentMethod: 'BKASH' | 'BANK';
    transactionId: string;
    screenshotUrl: string;
  }) {
    // Check duplicate transaction ID within the group
    const duplicate = await this.prisma.contribution.findUnique({
      where: { groupId_transactionId: { groupId: data.groupId, transactionId: data.transactionId } },
    });
    if (duplicate) throw new BadRequestException('Transaction ID already submitted');

    // Check if already submitted for this month
    const existing = await this.prisma.contribution.findFirst({
      where: {
        userId,
        groupId: data.groupId,
        month: data.month,
        year: data.year,
        status: { in: ['PENDING', 'VERIFIED'] },
      },
    });
    if (existing) throw new BadRequestException('Contribution already submitted for this month');

    const contribution = await this.prisma.contribution.create({
      data: { userId, ...data },
    });

    // Auto-check for late fine: if submitted after the group deadline
    const group = await this.prisma.group.findUnique({ where: { id: data.groupId } });
    if (group) {
      const deadline = new Date(data.year, data.month - 1, group.fineDeadlineDay, 23, 59, 59);
      const submittedAt = new Date();

      if (submittedAt > deadline) {
        // Check if fine already exists
        const existingFine = await this.prisma.fine.findUnique({
          where: { userId_groupId_month_year: { userId, groupId: data.groupId, month: data.month, year: data.year } },
        });

        if (!existingFine) {
          await this.prisma.fine.create({
            data: {
              userId,
              groupId: data.groupId,
              month: data.month,
              year: data.year,
              amount: group.fineAmount,
            },
          });
          await this.auditService.log(userId, data.groupId, 'AUTO_FINE', 'Fine', userId, {
            month: data.month, year: data.year, amount: group.fineAmount, reason: 'Late submission',
          });
        }
      }
    }

    await this.auditService.log(userId, data.groupId, 'SUBMIT', 'Contribution', contribution.id, {
      month: data.month,
      year: data.year,
      amount: data.amount,
      txId: data.transactionId,
    });

    return contribution;
  }

  async verify(verifierId: string, contributionId: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) {
    const contribution = await this.prisma.contribution.findUnique({ where: { id: contributionId } });
    if (!contribution) throw new NotFoundException('Contribution not found');
    if (contribution.status !== 'PENDING') throw new BadRequestException('Contribution already processed');

    if (status === 'REJECTED' && !rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const updated = await this.prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedBy: verifierId,
        verifiedAt: new Date(),
      },
    });

    await this.auditService.log(verifierId, contribution.groupId, status === 'VERIFIED' ? 'VERIFY' : 'REJECT', 'Contribution', contributionId, {
      rejectionReason,
    });

    return updated;
  }

  async getPendingForGroup(groupId: string) {
    return this.prisma.contribution.findMany({
      where: { groupId, status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async getGroupContributions(groupId: string, month?: number, year?: number) {
    const where: any = { groupId };
    if (month) where.month = month;
    if (year) where.year = year;

    return this.prisma.contribution.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getUserContributions(userId: string, groupId: string) {
    return this.prisma.contribution.findMany({
      where: { userId, groupId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getPaymentStatusGrid(groupId: string, month: number, year: number) {
    const members = await this.prisma.membership.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const contributions = await this.prisma.contribution.findMany({
      where: { groupId, month, year },
    });

    const fines = await this.prisma.fine.findMany({
      where: { groupId, month, year },
    });

    return members.map((m) => {
      const contribution = contributions.find((c) => c.userId === m.userId);
      const fine = fines.find((f) => f.userId === m.userId);

      let status: 'paid' | 'pending' | 'late' | 'not_paid' = 'not_paid';
      if (contribution?.status === 'VERIFIED') status = 'paid';
      else if (contribution?.status === 'PENDING') status = 'pending';
      else if (fine) status = 'late';

      return {
        user: m.user,
        role: m.role,
        contribution,
        fine,
        status,
      };
    });
  }
}
