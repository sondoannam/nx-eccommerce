import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SendOtpDto, OtpResponseDto, VerifyOtpDto } from './dtos/otp.dto';
import { VerifyOtpResultDto } from './dtos/otp-verification.dto';

@ApiTags('Email Service')
@Controller('email')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get email queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getQueueStats() {
    return this.appService.getQueueStats();
  }

  @Post('otp/verification')
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiResponse({
    status: 201,
    description: 'Email verification OTP queued successfully',
    type: OtpResponseDto,
  })
  async sendEmailVerificationOtp(@Body() data: SendOtpDto) {
    return this.appService.queueEmailVerificationOtp(data);
  }

  @Post('otp/password-reset')
  @ApiOperation({ summary: 'Send password reset OTP' })
  @ApiResponse({
    status: 201,
    description: 'Password reset OTP queued successfully',
    type: OtpResponseDto,
  })
  async sendPasswordResetOtp(@Body() data: SendOtpDto) {
    return this.appService.queuePasswordResetOtp(data);
  }

  @Post('otp/two-factor')
  @ApiOperation({ summary: 'Send two-factor authentication OTP' })
  @ApiResponse({
    status: 201,
    description: 'Two-factor OTP queued successfully',
    type: OtpResponseDto,
  })
  async sendTwoFactorOtp(@Body() data: SendOtpDto) {
    return this.appService.queueTwoFactorOtp(data);
  }

  @Post('welcome')
  @ApiOperation({ summary: 'Queue welcome email' })
  @ApiResponse({
    status: 201,
    description: 'Welcome email queued successfully',
  })
  async sendWelcomeEmail(
    @Body() data: { email: string; name: string; userType: string }
  ) {
    return this.appService.queueWelcomeEmail(data);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({
    status: 200,
    description: 'OTP verification result',
    type: VerifyOtpResultDto,
  })
  async verifyOtp(@Body() data: VerifyOtpDto): Promise<VerifyOtpResultDto> {
    return this.appService.verifyOtp(data);
  }
}
