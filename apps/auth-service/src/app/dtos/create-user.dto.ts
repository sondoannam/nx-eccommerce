import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from 'packages/libs/utils';

/**
 * Data Transfer Object for user registration
 * Includes validation and transformation rules
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
    required: true,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }: TransformFnParams) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description:
      'User password. Must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number',
    example: 'Password123',
    required: true,
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message:
      'Password requires at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
  @ApiProperty({
    description: 'The role of the user',
    enum: UserRole,
    default: UserRole.USER,
    required: false,
  })
  @IsEnum(UserRole, { message: 'Invalid role' })
  @IsOptional()
  role?: UserRole = UserRole.USER;
}
