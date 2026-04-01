import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FineService } from './fine.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GroupRoles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('Fines')
@Controller('groups/:groupId/fines')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FineController {
  constructor(private fineService: FineService) {}

  @Post('calculate')
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Calculate fines for a month (Manager only)' })
  async calculate(
    @Param('groupId') groupId: string,
    @Body() body: { month: number; year: number },
  ) {
    return this.fineService.calculateFines(groupId, body.month, body.year);
  }

  @Patch(':fineId/waive')
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Waive a fine with reason (Manager only)' })
  async waive(
    @CurrentUser('sub') actorId: string,
    @Param('fineId') fineId: string,
    @Body() body: { reason: string },
  ) {
    return this.fineService.waiveFine(actorId, fineId, body.reason);
  }

  @Get()
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Get all fines for a group (Manager only)' })
  async getGroupFines(
    @Param('groupId') groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.fineService.getGroupFines(groupId, Number(month) || undefined, Number(year) || undefined);
  }

  @Get('my')
  @GroupRoles('MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Get my fines in this group' })
  async getMyFines(
    @CurrentUser('sub') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.fineService.getUserFines(userId, groupId);
  }
}
