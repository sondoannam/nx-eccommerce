import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for authentication responses
 * Used for both registration and login responses
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token (JWT) for API authorization',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: '6c84fb90-12c4-11e1-840d-7b25c5ee775a',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Expiration date of the access token',
    example: '2023-12-31T23:59:59.999Z',
  })
  expiresAt: Date;
}
