import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  @IsJWT()
  access_token: string;

  @ApiProperty({ description: 'JWT Refresh Token' })
  @IsJWT()
  refresh_token: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT Refresh Token previously issued' })
  @IsJWT()
  @IsNotEmpty()
  refresh_token: string;
} 