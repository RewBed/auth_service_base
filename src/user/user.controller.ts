import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthorizeUserDto } from './dto/authorize-user.dto';
import { AuthorizeUserResponseDto } from './dto/authorize-user.response.dto';
import { UserService } from './user.service';
import { AccessTokenGuard } from './guards/access-token.guard';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './dto/change-password.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from './dto/refresh-token.dto';
import { AccessTokenPayload } from './types/access-token-payload.type';

type RequestWithUser = Request & { user: AccessTokenPayload };

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOkResponse({ type: AuthorizeUserResponseDto })
  @Post('auth')
  authorize(@Body() dto: AuthorizeUserDto): Promise<AuthorizeUserResponseDto> {
    return this.userService.authorize(dto);
  }

  @ApiOkResponse({ type: RefreshTokenResponseDto })
  @Post('auth/refresh')
  refreshAuthTokens(
    @Body() dto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.userService.refreshAuthTokens(dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: ChangePasswordResponseDto })
  @UseGuards(AccessTokenGuard)
  @Post('password/change')
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    await this.userService.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );

    return {
      message: 'Password changed successfully',
    };
  }
}
