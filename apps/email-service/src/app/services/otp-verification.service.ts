/**
 * OTPimport { OtpStatus, OtpType } from 'generated/prisma';
import { 
  CreateOtpVerificationDto, 
  OtpVerificationResponseDto, 
  VerifyOtpVerificationDto, 
  VerifyOtpResultDto,
  CleanupOtpResponseDto
} from '../dtos';ation service for managing OTP operations with database
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'packages/libs/prisma';
import { OtpStatus, OtpType } from 'generated/prisma';
import {
  CreateOtpVerificationDto,
  OtpVerificationResponseDto,
  VerifyOtpVerificationDto,
  VerifyOtpResultDto,
  CleanupOtpResponseDto,
} from '../dtos/otp-verification.dto';

@Injectable()
export class OtpVerificationService {
  private readonly logger = new Logger(OtpVerificationService.name);
  private readonly defaultExpiryMinutes = 5;
  private readonly maxAttempts = 3;

  constructor(private readonly prisma: PrismaService) {}
  /**
   * Create a new OTP verification record in the database
   */
  async createOtpVerification(
    data: CreateOtpVerificationDto
  ): Promise<OtpVerificationResponseDto> {
    try {
      const {
        userId,
        otpCode,
        otpType,
        expiryMinutes = this.defaultExpiryMinutes,
        metadata,
      } = data;

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

      // Check if there's a pending OTP of the same type for this user
      const existingOtp = await this.prisma.otpVerification.findFirst({
        where: {
          userId,
          otpType,
          status: OtpStatus.PENDING,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingOtp) {
        // If the existing OTP was created less than 1 minute ago, prevent creating a new one
        const oneMinuteAgo = new Date();
        oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

        if (existingOtp.createdAt > oneMinuteAgo) {
          throw new ConflictException(
            'Please wait before requesting another OTP'
          );
        }

        // Invalidate the existing OTP
        await this.prisma.otpVerification.update({
          where: { id: existingOtp.id },
          data: { status: OtpStatus.EXPIRED },
        });
      } // Create a new OTP verification record
      const otpVerification = await this.prisma.otpVerification.create({
        data: {
          userId,
          otpCode,
          otpType,
          status: OtpStatus.PENDING,
          expiresAt,
          attempts: 0,
          maxAttempts: this.maxAttempts,
          metadata: metadata ? JSON.stringify(metadata) : '{}',
        },
      });

      this.logger.log(
        `Created OTP verification record for user ${userId} with type ${otpType}`
      );

      return {
        id: otpVerification.id,
        otpCode: otpVerification.otpCode,
        expiresAt: otpVerification.expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create OTP verification: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
  /**
   * Verify an OTP code for a user
   */
  async verifyOtp(data: VerifyOtpVerificationDto): Promise<VerifyOtpResultDto> {
    try {
      const { userId, otpCode, otpType } = data;

      // Find the latest pending OTP for this user and type
      const otpVerification = await this.prisma.otpVerification.findFirst({
        where: {
          userId,
          otpType,
          status: OtpStatus.PENDING,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!otpVerification) {
        throw new NotFoundException('OTP not found or has expired');
      }

      // Check if max attempts reached
      if (otpVerification.attempts >= otpVerification.maxAttempts) {
        await this.prisma.otpVerification.update({
          where: { id: otpVerification.id },
          data: { status: OtpStatus.FAILED },
        });
        throw new BadRequestException('Maximum verification attempts exceeded');
      }

      // Increment attempt count
      await this.prisma.otpVerification.update({
        where: { id: otpVerification.id },
        data: { attempts: { increment: 1 } },
      });
      // Check if OTP matches
      if (otpVerification.otpCode !== otpCode) {
        this.logger.warn(
          `Invalid OTP attempt for user ${userId}, attempt ${
            otpVerification.attempts + 1
          }/${otpVerification.maxAttempts}`
        );
        return {
          success: false,
          message: 'Invalid OTP code',
        };
      }
      // Get current timestamp for verification
      const verifiedAt = new Date();

      // Mark OTP as verified
      await this.prisma.otpVerification.update({
        where: { id: otpVerification.id },
        data: {
          status: OtpStatus.VERIFIED,
          verifiedAt,
        },
      });

      // For email or phone verification, update the user's verification status
      if (
        otpType === OtpType.EMAIL_VERIFICATION ||
        otpType === OtpType.PHONE_VERIFICATION
      ) {
        await this.updateUserVerificationStatus(userId, otpType);
      }

      this.logger.log(
        `Successfully verified ${otpType} OTP for user ${userId}`
      );

      return {
        success: true,
        message: 'OTP verification successful',
        verifiedAt,
      };
    } catch (error) {
      this.logger.error(
        `OTP verification failed: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Update user's verification status after OTP verification
   */
  private async updateUserVerificationStatus(
    userId: string,
    otpType: OtpType
  ): Promise<void> {
    try {
      if (otpType === OtpType.EMAIL_VERIFICATION) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { isEmailVerified: true },
        });
      } else if (otpType === OtpType.PHONE_VERIFICATION) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { isPhoneVerified: true },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to update user verification status: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
  /**
   * Clean up expired OTP records (can be run as a scheduled task)
   */
  async cleanupExpiredOtps(): Promise<CleanupOtpResponseDto> {
    try {
      const result = await this.prisma.otpVerification.updateMany({
        where: {
          status: OtpStatus.PENDING,
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: OtpStatus.EXPIRED,
        },
      });
      const cleanedAt = new Date();
      this.logger.log(`Marked ${result.count} expired OTP records`);

      return {
        count: result.count,
        cleanedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to clean up expired OTPs: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
