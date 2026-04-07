import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { ContributionModule } from './contribution/contribution.module';
import { FineModule } from './fine/fine.module';
import { ExpenseModule } from './expense/expense.module';
import { UploadModule } from './upload/upload.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: process.env.VERCEL ? '/tmp' : join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuditModule,
    EmailModule,
    AuthModule,
    GroupModule,
    ContributionModule,
    FineModule,
    ExpenseModule,
    UploadModule,
  ],
})
export class AppModule {}
