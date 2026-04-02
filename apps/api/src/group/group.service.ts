import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GroupService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findUserGroups(userId: string) {
    return this.prisma.group.findMany({
      where: {
        memberships: { some: { userId, status: 'ACTIVE' } },
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { contributions: true } },
      },
    });
  }

  async findById(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, name: true, email: true, bkashNumber: true } } },
        },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async joinByInvite(userId: string, inviteCode: string) {
    const group = await this.prisma.group.findUnique({ where: { inviteCode } });
    if (!group) throw new BadRequestException('Invalid invite code');
    if (group.status !== 'ACTIVE') throw new BadRequestException('This group is not active');

    const existing = await this.prisma.membership.findUnique({
      where: { userId_groupId: { userId, groupId: group.id } },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') throw new BadRequestException('Already a member');
      await this.prisma.membership.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', leftAt: null },
      });
    } else {
      await this.prisma.membership.create({
        data: { userId, groupId: group.id, role: 'MEMBER' },
      });
    }

    await this.auditService.log(userId, group.id, 'JOIN', 'Membership', userId, { via: 'invite' });
    return { message: 'Joined group', groupId: group.id, groupName: group.name };
  }

  async addMemberByEmail(actorId: string, groupId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found. They must register first.');

    const existing = await this.prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
    });

    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('User is already a member');
    }

    if (existing) {
      await this.prisma.membership.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', leftAt: null, role: 'MEMBER' },
      });
    } else {
      await this.prisma.membership.create({
        data: { userId: user.id, groupId, role: 'MEMBER' },
      });
    }

    await this.auditService.log(actorId, groupId, 'ADD_MEMBER', 'Membership', user.id, { email });
    return { message: `${user.name} added to group` };
  }

  async removeMember(actorId: string, groupId: string, memberId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: memberId, groupId, status: 'ACTIVE' },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === 'MANAGER') throw new BadRequestException('Cannot remove the manager');

    await this.prisma.membership.update({
      where: { id: membership.id },
      data: { status: 'INACTIVE', leftAt: new Date() },
    });

    await this.auditService.log(actorId, groupId, 'REMOVE', 'Membership', memberId);
    return { message: 'Member removed' };
  }

  async getGroupSummary(groupId: string) {
    const [group, totalContributions, finesPaid, finesPending, finesAll, memberCount] = await Promise.all([
      this.prisma.group.findUnique({ where: { id: groupId } }),
      this.prisma.contribution.aggregate({
        where: { groupId, status: 'VERIFIED' },
        _sum: { amount: true },
      }),
      this.prisma.fine.aggregate({
        where: { groupId, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.fine.aggregate({
        where: { groupId, status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.fine.aggregate({
        where: { groupId },
        _sum: { amount: true },
      }),
      this.prisma.membership.count({ where: { groupId, status: 'ACTIVE' } }),
    ]);

    const contributions = totalContributions._sum.amount || 0;
    const paidFines = finesPaid._sum.amount || 0;
    const pendingFinesAmt = finesPending._sum.amount || 0;
    const allFines = finesAll._sum.amount || 0;

    return {
      group,
      totalCollected: contributions + paidFines,
      totalContributions: contributions,
      totalFines: allFines,
      totalFinesPaid: paidFines,
      totalFinesPending: pendingFinesAmt,
      memberCount,
    };
  }
}
