import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GroupRoles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GroupController {
  constructor(private groupService: GroupService) {}

  @Get()
  @ApiOperation({ summary: 'List groups the current user belongs to' })
  async findUserGroups(@CurrentUser('sub') userId: string) {
    return this.groupService.findUserGroups(userId);
  }

  @Get(':groupId')
  @GroupRoles('MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Get group details' })
  async findById(@Param('groupId') groupId: string) {
    return this.groupService.findById(groupId);
  }

  @Get(':groupId/summary')
  @GroupRoles('MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Get group financial summary' })
  async getSummary(@Param('groupId') groupId: string) {
    return this.groupService.getGroupSummary(groupId);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a group via invite code' })
  async join(
    @CurrentUser('sub') userId: string,
    @Body() body: { inviteCode: string },
  ) {
    return this.groupService.joinByInvite(userId, body.inviteCode);
  }

  @Post(':groupId/members')
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Add a member to the group (Manager only)' })
  async addMember(
    @CurrentUser('sub') actorId: string,
    @Param('groupId') groupId: string,
    @Body() body: { email: string },
  ) {
    return this.groupService.addMemberByEmail(actorId, groupId, body.email);
  }

  @Delete(':groupId/members/:memberId')
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Remove a member from the group (Manager only)' })
  async removeMember(
    @CurrentUser('sub') actorId: string,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupService.removeMember(actorId, groupId, memberId);
  }
}
