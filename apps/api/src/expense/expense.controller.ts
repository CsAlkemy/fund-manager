import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GroupRoles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('Expenses')
@Controller('groups/:groupId/expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Post()
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Record an expense (Manager only)' })
  async create(
    @CurrentUser('sub') actorId: string,
    @Param('groupId') groupId: string,
    @Body() body: { description: string; amount: number; category?: string; date?: string; receiptUrl: string },
  ) {
    return this.expenseService.create(actorId, groupId, body);
  }

  @Get()
  @GroupRoles('MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'List all expenses for a group (all members can view)' })
  async list(@Param('groupId') groupId: string) {
    return this.expenseService.getGroupExpenses(groupId);
  }

  @Delete(':expenseId')
  @GroupRoles('MANAGER')
  @ApiOperation({ summary: 'Delete an expense (Manager only)' })
  async delete(
    @CurrentUser('sub') actorId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expenseService.delete(actorId, expenseId);
  }
}
