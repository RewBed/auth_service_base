import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { AuthTokensDto } from './authorize-user.response.dto';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ type: AuthTokensDto })
  tokens: AuthTokensDto;

  @ApiProperty({
    description: 'Refresh timestamp in ISO format',
    example: '2026-02-11T10:15:00.000Z',
  })
  refreshedAt: string;
}
