/**
 * DTOs for OTP Verification Service
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { OtpType } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new OTP verification record
 */
export class CreateOtpVerificationDto {
  @ApiProperty({
    description: 'User ID',
    example: '65f7b4d1e2345a7b8c9d0e1f',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'OTP code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otpCode: string;

  @ApiProperty({
    description: 'Type of OTP verification',
    enum: OtpType,
    example: 'EMAIL_VERIFICATION',
  })
  @IsEnum(OtpType)
  otpType: OtpType;

  @ApiProperty({
    description: 'OTP expiry time in minutes',
    example: 5,
    required: false,
  })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  expiryMinutes?: number;
  @ApiProperty({
    description: 'Additional metadata for OTP record',
    example: { email: 'user@example.com', name: 'John Doe' },
    required: false,
    type: Object,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for OTP verification response
 */
export class OtpVerificationResponseDto {
  @ApiProperty({
    description: 'OTP verification record ID',
    example: '65f7b4d1e2345a7b8c9d0e1f',
  })
  id: string;

  @ApiProperty({
    description: 'OTP code',
    example: '123456',
  })
  otpCode: string;

  @ApiProperty({
    description: 'OTP expiration timestamp',
    example: '2025-05-28T12:30:00.000Z',
  })
  expiresAt: Date;
}

/**
 * DTO for verifying an OTP
 */
export class VerifyOtpVerificationDto {
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
    example: 'EMAIL_VERIFICATION',
  })
  @IsEnum(OtpType)
  otpType: OtpType;
}

/**
 * DTO for OTP verification result
 */
export class VerifyOtpResultDto {
  @ApiProperty({
    description: 'Whether the OTP verification was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message about the verification result',
    example: 'OTP verification successful',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when OTP was verified',
    example: '2025-05-28T12:35:00.000Z',
    required: false,
  })
  verifiedAt?: Date;
}

/**
 * DTO for OTP cleanup response
 */
export class CleanupOtpResponseDto {
  @ApiProperty({
    description: 'Number of expired OTPs that were cleaned up',
    example: 5,
  })
  count: number;

  @ApiProperty({
    description: 'Timestamp of the cleanup operation',
    example: '2025-05-28T12:00:00.000Z',
  })
  cleanedAt: Date;
}
