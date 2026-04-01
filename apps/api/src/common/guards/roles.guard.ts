import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredSystemRoles = this.reflector.getAllAndMerge<string[]>('systemRoles', [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredGroupRoles = this.reflector.get<string[]>('groupRoles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('No user context');

    // SUPER_ADMIN can access everything
    if (user.systemRole === 'SUPER_ADMIN') return true;

    // Check system-level roles
    if (requiredSystemRoles?.length) {
      if (requiredSystemRoles.includes(user.systemRole)) return true;
      throw new ForbiddenException('Insufficient system permissions');
    }

    // Check group-level roles
    if (requiredGroupRoles?.length) {
      const groupId = request.params.groupId || request.body?.groupId;
      if (!groupId) throw new ForbiddenException('Group context required');

      const membership = await this.prisma.membership.findUnique({
        where: { userId_groupId: { userId: user.sub, groupId } },
      });

      if (!membership || membership.status !== 'ACTIVE') {
        throw new ForbiddenException('Not a member of this group');
      }

      if (requiredGroupRoles.includes(membership.role)) {
        request.membership = membership;
        return true;
      }

      throw new ForbiddenException('Insufficient group permissions');
    }

    // No specific roles required — authenticated is enough
    return true;
  }
}
