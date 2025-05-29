import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'packages/libs/utils';

/**
 * User model for internal application logic
 */
export class User {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User email address (unique)',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'IDs of users being followed',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  following: string[];

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User account creation date',
    example: '2023-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of user account',
    example: '2023-01-01T12:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * User response model - public representation of a user
 * Sensitive data like password is removed
 */
export class UserResponse {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'IDs of users being followed',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  following: string[];
  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'URL to user avatar image',
    example: 'https://example.com/avatars/user.jpg',
    required: false,
    nullable: true,
  })
  avatarUrl?: string;

  @ApiProperty({
    description: 'User account creation date',
    example: '2023-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of user account',
    example: '2023-01-01T12:00:00.000Z',
  })
  updatedAt: Date;
}
