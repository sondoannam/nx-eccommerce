import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'packages/libs/utils';
import { AbstractModel } from 'packages/libs/abstract';
import { User as PUser } from '@prisma/client';

export type PrismaUser = PUser;

/**
 * User model for internal application logic
 */
export class User extends AbstractModel {
  constructor(data: Partial<PrismaUser>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: String,
    example: 'Nam Son',
  })
  name: string;

  @ApiProperty({
    type: String || null,
    example: 'sondoannam202@gmail.com',
  })
  email: string | null;

  @ApiProperty({
    type: String || null,
    example: '0123456789',
  })
  phone: string | null;

  //   @ApiPropertyOptional({
  //     type: Image,
  //     description: 'User avatar',
  //   })
  //   avatar?: Image;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  isPhoneVerified: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  is_blocked: boolean;

  @ApiProperty({
    example: UserRole.USER,
    enum: UserRole,
    type: String,
  })
  role: UserRole;
}
