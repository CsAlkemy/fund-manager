import { SetMetadata } from '@nestjs/common';

export const SystemRoles = (...roles: string[]) => SetMetadata('systemRoles', roles);
export const GroupRoles = (...roles: string[]) => SetMetadata('groupRoles', roles);
