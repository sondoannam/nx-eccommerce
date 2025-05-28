import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum OtpType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',
}

export enum Language {
  EN = 'en',
  VI = 'vi',
}

export class SendOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User name for personalization',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type of OTP verification',
    enum: OtpType,
    example: OtpType.EMAIL_VERIFICATION,
  })
  @IsEnum(OtpType)
  otpType: OtpType;

  @ApiProperty({
    description: 'User ID for tracking',
    example: '65f7b4d1e2345a7b8c9d0e1f',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Language preference for email template',
    enum: Language,
    example: Language.EN,
    required: false,
  })
  @IsEnum(Language)
  @IsOptional()
  language?: Language = Language.EN;
}

export class OtpResponseDto {
  @ApiProperty({
    description: 'Job ID for tracking the email sending process',
    example: 'email-otp-12345',
  })
  jobId: string;

  @ApiProperty({
    description: 'Success message',
    example: 'OTP has been sent successfully',
  })
  message: string;

  @ApiProperty({
    description: 'OTP expiration time in minutes',
    example: 5,
  })
  expiresInMinutes: number;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'User ID',
    example: '65f7b4d1e2345a7b8c9d0e1f',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'OTP code to verify',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otpCode: string;

  @ApiProperty({
    description: 'Type of OTP verification',
    enum: OtpType,
    example: OtpType.EMAIL_VERIFICATION,
  })
  @IsEnum(OtpType)
  otpType: OtpType;
}
