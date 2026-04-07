import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { InviteController } from './invite.controller';
import { GroupService } from './group.service';

@Module({
  controllers: [GroupController, InviteController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
