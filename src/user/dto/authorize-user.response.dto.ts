import { ApiProperty } from '@nestjs/swagger';

export class AuthorizedUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty()
  role: string;
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;
}

export class AuthorizeUserResponseDto {
  @ApiProperty({ type: AuthorizedUserDto })
  user: AuthorizedUserDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens: AuthTokensDto;

  @ApiProperty({
    description: 'Authorization timestamp in ISO format',
    example: '2026-02-11T10:00:00.000Z',
  })
  authenticatedAt: string;
}
