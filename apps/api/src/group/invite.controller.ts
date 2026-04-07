import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Invite')
@Controller('invite')
export class InviteController {
  constructor(private prisma: PrismaService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Get public group info by invite code (no auth required)' })
  async getGroupByInvite(@Param('code') code: string) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode: code },
      include: {
        _count: { select: { memberships: true } },
      },
    });

    if (!group) throw new NotFoundException('Invalid invite code');

    return {
      name: group.name,
      description: group.description,
      logoUrl: group.logoUrl,
      coverUrl: group.coverUrl,
      status: group.status,
      memberCount: group._count.memberships,
    };
  }
}
