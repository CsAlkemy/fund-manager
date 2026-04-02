import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private resend: Resend | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  async requestOtp(email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find existing user for this email
    const user = await this.prisma.user.findUnique({ where: { email } });

    await this.prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt,
        userId: user?.id,
      },
    });

    // Send OTP via Resend if configured, otherwise log to console
    if (this.resend) {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'Fund Manager <noreply@fund-manager.app>',
        to: email,
        subject: 'Your Fund Manager Login Code',
        html: `
          <h2>Your login code</h2>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } else {
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return { message: 'OTP sent' };
  }

  async verifyOtp(email: string, code: string) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Find or flag new user
    let user = await this.prisma.user.findUnique({ where: { email } });
    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: { email, name: email.split('@')[0] },
      });
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    return { token, isNewUser };
  }

  async register(userId: string, data: { name: string; phone?: string; bkashNumber?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        bkashNumber: data.bkashNumber,
      },
    });

    return { user: { id: user.id, name: user.name, email: user.email } };
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
        systemRole: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: { group: { select: { id: true, name: true } } },
        },
      },
    });

    if (!user) throw new BadRequestException('User not found');
    return user;
  }
}
