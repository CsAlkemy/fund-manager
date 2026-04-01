import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GroupRoles } from '../common/decorators/roles.decorator';

@ApiTags('Audit')
@Controller('groups/:groupId/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Get audit log for a group (Manager only)' })
  async getGroupLogs(
    @Param('groupId') groupId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    return this.auditService.getGroupLogs(groupId, Number(page) || 1, Number(limit) || 50);
  }
}
