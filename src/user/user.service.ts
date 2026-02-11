import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { PrismaService } from '../core/database/prisma.service';
import { AuthorizeUserDto } from './dto/authorize-user.dto';
import {
  AuthorizeUserResponseDto,
  AuthTokensDto,
} from './dto/authorize-user.response.dto';
import { UserStatus } from 'generated/prisma/enums';
import { hashPassword, verifyPassword } from './password.util';
import { AccessTokenPayload } from './types/access-token-payload.type';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from './dto/refresh-token.dto';
import { RefreshTokenPayload } from './types/refresh-token-payload.type';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async authorize(dto: AuthorizeUserDto): Promise<AuthorizeUserResponseDto> {
    const login = dto.login.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: login }, { email: login }],
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active');
    }

    const isPasswordValid = verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.username, user.role);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens,
      authenticatedAt: new Date().toISOString(),
    };
  }

  async refreshAuthTokens(
    dto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        dto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active');
    }

    const tokens = await this.issueTokens(user.id, user.username, user.role);

    return {
      tokens,
      refreshedAt: new Date().toISOString(),
    };
  }

  async verifyAccessTokenForGrpc(accessToken: string): Promise<{
    valid: boolean;
    user_id: string;
    username: string;
    role: string;
    message: string;
  }> {
    const token = accessToken.trim();

    console.log(token)

    if (!token) {
      return {
        valid: false,
        user_id: '',
        username: '',
        role: '',
        message: 'Access token is required',
      };
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      return {
        valid: false,
        user_id: '',
        username: '',
        role: '',
        message: 'Invalid access token',
      };
    }

    if (payload.type !== 'access' || !payload.sub) {
      return {
        valid: false,
        user_id: '',
        username: '',
        role: '',
        message: 'Invalid access token payload',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      return {
        valid: false,
        user_id: '',
        username: '',
        role: '',
        message: 'User not found',
      };
    }

    if (user.status !== UserStatus.ACTIVE) {
      return {
        valid: false,
        user_id: user.id,
        username: user.username,
        role: user.role,
        message: 'User is not active',
      };
    }

    return {
      valid: true,
      user_id: user.id,
      username: user.username,
      role: user.role,
      message: 'Token is valid',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User is not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active');
    }

    const isCurrentPasswordValid = verifyPassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is invalid');
    }

    if (verifyPassword(newPassword, user.passwordHash)) {
      throw new ForbiddenException(
        'New password must differ from current password',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });
  }

  private async issueTokens(
    userId: string,
    username: string,
    role: string,
  ): Promise<AuthTokensDto> {
    const accessPayload: AccessTokenPayload = {
      sub: userId,
      username,
      role,
      type: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      type: 'refresh',
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_ACCESS_TTL',
      ) as StringValue,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_TTL',
      ) as StringValue,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }
}
