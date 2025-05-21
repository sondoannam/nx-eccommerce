import crypto from 'crypto';
import { Role } from 'generated/prisma';
import { ValidationError } from 'packages/error-handler';
import { sign } from 'jsonwebtoken';
import { CreateUserDto } from '../app/dtos';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

/**
 * Validates user registration data
 * @param data User data to validate
 * @param userType The role of the user
 * @throws ValidationError if validation fails
 */
export const validateRegistrationData = (
  data: CreateUserDto,
  userType: Role
) => {
  const { email, password, name } = data;

  if (!email || !password || !name) {
    throw new ValidationError('All fields are required');
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (!passwordRegex.test(password)) {
    throw new ValidationError(
      'Password requires at least 8 characters, one uppercase letter, one lowercase letter, and one number'
    );
  }
};

/**
 * Generates a JWT token for authentication
 * @param userId The user ID to include in the token
 * @param email The user's email
 * @param role The user's role
 * @returns The generated JWT token
 */
export const generateToken = (
  userId: string,
  email: string,
  role: Role
): string => {
  const payload = {
    sub: userId,
    email,
    role,
  };

  // Use 24 hours as the token expiration time
  const TOKEN_EXPIRATION = '24h';

  return sign(payload, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: TOKEN_EXPIRATION,
  });
};

/**
 * Generates a refresh token
 * @returns A random refresh token
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};
