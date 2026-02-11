import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'current_password' })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  currentPassword: string;

  @ApiProperty({ example: 'new_strong_password' })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  newPassword: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ example: 'Password changed successfully' })
  message: string;
}
