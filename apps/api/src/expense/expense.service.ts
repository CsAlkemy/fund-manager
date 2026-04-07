import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExpenseService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    actorId: string,
    groupId: string,
    data: {
      description: string;
      amount: number;
      category?: string;
      date?: string;
      receiptUrl: string;
    },
  ) {
    const expense = await this.prisma.expense.create({
      data: {
        groupId,
        description: data.description,
        amount: data.amount,
        category: data.category as any,
        date: data.date ? new Date(data.date) : undefined,
        receiptUrl: data.receiptUrl,
        recordedBy: actorId,
      },
      include: { recorder: { select: { id: true, name: true, email: true } } },
    });

    await this.auditService.log(actorId, groupId, 'CREATE', 'Expense', expense.id, {
      description: data.description,
      amount: data.amount,
      category: data.category,
    });

    return expense;
  }

  async getGroupExpenses(groupId: string) {
    return this.prisma.expense.findMany({
      where: { groupId },
      include: { recorder: { select: { id: true, name: true, email: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async delete(actorId: string, expenseId: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new NotFoundException('Expense not found');

    await this.prisma.expense.delete({ where: { id: expenseId } });

    await this.auditService.log(actorId, expense.groupId, 'DELETE', 'Expense', expenseId, {
      description: expense.description,
      amount: expense.amount,
    });

    return { deleted: true };
  }
}
