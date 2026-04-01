import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContributionService } from './contribution.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GroupRoles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('Contributions')
@Controller('groups/:groupId/contributions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContributionController {
  constructor(private contributionService: ContributionService) {}

  @Post()
  @GroupRoles('MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Submit a payment contribution' })
  async submit(
    @CurrentUser('sub') userId: string,
    @Param('groupId') groupId: string,
    @Body() body: {
      month: number;
      year: number;
      amount: number;
      paymentMethod: 'BKASH' | 'BANK';
      transactionId: string;
      screenshotUrl: string;
    },
  ) {
    return this.contributionService.submit(userId, { groupId, ...body });
  }

  @Patch(':contributionId/verify')
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Verify or reject a contribution (Manager only)' })
  async verify(
    @CurrentUser('sub') verifierId: string,
    @Param('contributionId') contributionId: string,
    @Body() body: { status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string },
  ) {
    return this.contributionService.verify(verifierId, contributionId, body.status, body.rejectionReason);
  }

  @Get('pending')
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Get pending contributions for verification (Manager only)' })
  async getPending(@Param('groupId') groupId: string) {
    return this.contributionService.getPendingForGroup(groupId);
  }

  @Get()
  @GroupRoles('MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Get all contributions for a group' })
  async getAll(
    @Param('groupId') groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.contributionService.getGroupContributions(groupId, Number(month) || undefined, Number(year) || undefined);
  }

  @Get('my')
  @GroupRoles('MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Get my contributions in this group' })
  async getMine(
    @CurrentUser('sub') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.contributionService.getUserContributions(userId, groupId);
  }

  @Get('status-grid')
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Payment status grid for all members (Manager only)' })
  async getStatusGrid(
    @Param('groupId') groupId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.contributionService.getPaymentStatusGrid(groupId, Number(month), Number(year));
  }
}
