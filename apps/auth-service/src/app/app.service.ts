import { ConflictException, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import {
  generateRefreshToken,
  generateToken,
  validateRegistrationData,
} from '../utils/helper.util';
import { PrismaBaseService } from 'packages/prisma/prisma-client-base';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaBaseService) {}

  /**
   * Register a new user
   * @param userData - The user data from the request
   * @returns User data and authentication tokens
   */
  async registerNewUser(userData: CreateUserDto): Promise<AuthResponseDto> {
    // Validate the registration data
    validateRegistrationData(userData, userData.role);

    // Check if user with the same email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await hash(userData.password, 10);

    // Create the user
    const newUser = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        following: [],
      },
    });

    // Generate tokens
    const accessToken = generateToken(newUser.id, newUser.email, newUser.role);
    const refreshToken = generateRefreshToken();

    // Calculate expiration (1 day from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    // TODO: In a complete implementation, save the refresh token to the database

    // Return only tokens and expiration as requested
    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }
}
