import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@app/common';
import { JwtPayload } from '@app/auth';
import { PrismaService } from './prisma/prisma.service';

export interface LoginResult {
  accessToken: string;
  user: {
    id: number;
    username: string;
    role: Role;
  };
}

export interface ValidatedUser {
  id: number;
  username: string;
  role: Role;
}

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate credentials and issue a signed JWT access token.
   * Throws UnauthorizedException on unknown user or wrong password.
   */
  async login(username: string, password: string): Promise<LoginResult> {
    this.logger.log(`Login attempt for username="${username}"`);

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      this.logger.warn(`Authentication failed: user not found`);
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      this.logger.warn(`Authentication failed: invalid password`);
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role as Role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    this.logger.log(`Login success for userId=${user.id}`);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as Role,
      },
    };
  }

  /**
   * Return a public-safe user record by id (no password).
   * Used by other flows that need to resolve a user by their JWT `sub`.
   */
  async findById(id: number): Promise<ValidatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role as Role,
    };
  }
}
