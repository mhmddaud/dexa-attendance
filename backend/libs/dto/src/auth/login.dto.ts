import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Unique username' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username: string;

  @ApiProperty({ example: 'password', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(100)
  password: string;
}
