import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Register a new user
   */
  async register(createUserDto: CreateUserDto) {
    this.logger.log(`Registering new user with email: ${createUserDto.email}`);

    // Create the user
    const user = await this.userService.create(createUserDto);

    // Generate JWT tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Login a user with email and password
   */
  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for: ${loginDto.email}`);

    // Validate will be called by the guard, but we can use it directly
    const user = await this.userService.validateUser(
      loginDto.email,
      loginDto.password
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }
  /**
   * Generate access and refresh tokens for a user
   */
  generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      // In production, refresh tokens should have a longer expiration time
      // and be stored in a database
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user: User) {
    const sanitized = { ...user };
    delete sanitized.password;
    return sanitized;
  }
}
