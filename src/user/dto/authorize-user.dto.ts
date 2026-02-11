import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AuthorizeUserDto {
  @ApiProperty({
    description: 'Username or email',
    example: 'johndoe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(320)
  login: string;

  @ApiProperty({
    description: 'User password',
    example: 'P@ssw0rd123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  password: string;
}
