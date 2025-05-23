import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsIn, IsOptional, IsEnum } from 'class-validator';
import { EmailSendingTemplateType, EmailSendingTypeEnum } from '../types';

export class VerificationEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send verification code',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code to be sent',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'en',
    description: 'Language for email template',
    enum: ['en', 'vi'],
    default: 'en',
    required: false,
  })
  @IsOptional()
  @IsIn(['en', 'vi'])
  lang?: 'en' | 'vi' = 'en';

  @ApiProperty({
    example: 'register',
    description: 'Type of verification email',
    enum: EmailSendingTypeEnum,
    default: EmailSendingTypeEnum.VERIFY_ACCOUNT,
  })
  @IsIn([EmailSendingTypeEnum.VERIFY_ACCOUNT, EmailSendingTypeEnum.FORGOT_PASSWORD])
  @IsEnum(EmailSendingTypeEnum)
  type: EmailSendingTemplateType = EmailSendingTypeEnum.VERIFY_ACCOUNT;
}
