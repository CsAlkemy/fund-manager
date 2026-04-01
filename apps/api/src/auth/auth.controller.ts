import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  @ApiOperation({ summary: 'Request OTP code via email' })
  async requestOtp(@Body() body: { email: string }) {
    return this.authService.requestOtp(body.email);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and get JWT token' })
  async verifyOtp(@Body() body: { email: string; code: string }) {
    return this.authService.verifyOtp(body.email, body.code);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete user registration after first login' })
  async register(
    @CurrentUser('sub') userId: string,
    @Body() body: { name: string; phone?: string; bkashNumber?: string },
  ) {
    return this.authService.register(userId, body);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with group memberships' })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }
}
