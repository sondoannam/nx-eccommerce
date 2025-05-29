import { ConflictError, NotFoundError } from 'packages/error-handler';
import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { PrismaService } from 'packages/libs/prisma';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    return user;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found with this email');
    }

    return user;
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Validate user credentials for login
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
