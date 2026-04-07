import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async register(data: { email: string; password: string; name: string; phone?: string; bkashNumber?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        bkashNumber: data.bkashNumber,
      },
    });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    return { token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    return { token };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        bkashNumber: true,
        avatarUrl: true,
        systemRole: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: { group: { select: { id: true, name: true, logoUrl: true } } },
        },
      },
    });

    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; bkashNumber?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, phone: true, bkashNumber: true, avatarUrl: true, systemRole: true },
    });
    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    // Invalidate all previous unused codes for this email
    await this.prisma.otpCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const code = Math.random().toString().slice(2, 8).padStart(6, '0');
    await this.prisma.otpCode.create({
      data: {
        email,
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    await this.emailService.sendPasswordResetCode(email, code);

    return { message: 'A reset code has been sent to your email.' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const otpCode = await this.prisma.otpCode.findFirst({
      where: { email, code, used: false, expiresAt: { gt: new Date() } },
    });

    if (!otpCode) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.prisma.otpCode.update({
      where: { id: otpCode.id },
      data: { used: true },
    });

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.auditService.log(user.id, null, 'PASSWORD_RESET', 'User', user.id);

    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      throw new BadRequestException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.auditService.log(userId, null, 'PASSWORD_CHANGED', 'User', userId);

    return { message: 'Password changed successfully.' };
  }
}
