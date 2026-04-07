import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SystemRoles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@SystemRoles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (Super Admin only)' })
  async listUsers(@Query('page') page?: string, @Query('limit') limit?: string): Promise<any> {
    const p = Number(page) || 1;
    const l = Number(limit) || 50;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          memberships: { where: { status: 'ACTIVE' }, include: { group: { select: { id: true, name: true, logoUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page: p, limit: l };
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a user (Super Admin only)' })
  async createUser(
    @CurrentUser('sub') actorId: string,
    @Body() body: { email: string; password: string; name: string; phone?: string },
  ): Promise<any> {
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new BadRequestException('Email already registered');
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: { email: body.email, password: hashedPassword, name: body.name, phone: body.phone },
    });
    await this.auditService.log(actorId, null, 'CREATE', 'User', user.id, { email: user.email });
    return user;
  }

  @Get('groups')
  @ApiOperation({ summary: 'List all groups with details (Super Admin only)' })
  async listAllGroups(): Promise<any> {
    return this.prisma.group.findMany({
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        _count: { select: { contributions: true, fines: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create a new group (Super Admin only)' })
  async createGroup(
    @CurrentUser('sub') userId: string,
    @Body() body: { name: string; description?: string; monthlyAmount?: number; fineAmount?: number; fineDeadlineDay?: number },
  ): Promise<any> {
    const group = await this.prisma.group.create({
      data: {
        name: body.name,
        description: body.description,
        monthlyAmount: body.monthlyAmount ?? 1000,
        fineAmount: body.fineAmount ?? 100,
        fineDeadlineDay: body.fineDeadlineDay ?? 15,
      },
    });
    await this.auditService.log(userId, group.id, 'CREATE', 'Group', group.id, { name: group.name });
    return group;
  }

  @Patch('groups/:groupId')
  @ApiOperation({ summary: 'Update group settings (Super Admin only)' })
  async updateGroup(
    @CurrentUser('sub') userId: string,
    @Param('groupId') groupId: string,
    @Body() body: { name?: string; description?: string; monthlyAmount?: number; fineAmount?: number; fineDeadlineDay?: number },
  ): Promise<any> {
    const group = await this.prisma.group.update({ where: { id: groupId }, data: body });
    await this.auditService.log(userId, groupId, 'UPDATE', 'Group', groupId, body);
    return group;
  }

  @Patch('groups/:groupId/status')
  @ApiOperation({ summary: 'Pause/activate/archive a group (Super Admin only)' })
  async updateGroupStatus(
    @CurrentUser('sub') userId: string,
    @Param('groupId') groupId: string,
    @Body() body: { status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' },
  ): Promise<any> {
    const group = await this.prisma.group.update({ where: { id: groupId }, data: { status: body.status } });
    await this.auditService.log(userId, groupId, 'STATUS_CHANGE', 'Group', groupId, { status: body.status });
    return group;
  }

  @Delete('groups/:groupId')
  @ApiOperation({ summary: 'Delete a group (Super Admin only)' })
  async deleteGroup(
    @CurrentUser('sub') userId: string,
    @Param('groupId') groupId: string,
  ): Promise<any> {
    await this.auditService.log(userId, groupId, 'DELETE', 'Group', groupId);
    await this.prisma.group.delete({ where: { id: groupId } });
    return { message: 'Group deleted' };
  }

  @Patch('groups/:groupId/manager')
  @ApiOperation({ summary: 'Assign a manager to a group (one manager per group, Super Admin only)' })
  async assignManager(
    @CurrentUser('sub') userId: string,
    @Param('groupId') groupId: string,
    @Body() body: { managerId: string },
  ): Promise<any> {
    // Remove existing manager(s)
    await this.prisma.membership.updateMany({
      where: { groupId, role: 'MANAGER' },
      data: { role: 'MEMBER' },
    });

    // Upsert the new manager
    const existing = await this.prisma.membership.findUnique({
      where: { userId_groupId: { userId: body.managerId, groupId } },
    });

    if (existing) {
      await this.prisma.membership.update({
        where: { id: existing.id },
        data: { role: 'MANAGER', status: 'ACTIVE' },
      });
    } else {
      await this.prisma.membership.create({
        data: { userId: body.managerId, groupId, role: 'MANAGER' },
      });
    }

    await this.auditService.log(userId, groupId, 'ASSIGN_MANAGER', 'Membership', body.managerId);
    return { message: 'Manager assigned' };
  }

  @Get('audit')
  @ApiOperation({ summary: 'System-wide audit log (Super Admin only)' })
  async getSystemAudit(@Query('page') page?: string, @Query('limit') limit?: string): Promise<any> {
    const p = Number(page) || 1;
    const l = Number(limit) || 100;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
          group: { select: { id: true, name: true, logoUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { logs, total, page: p, limit: l };
  }
}
