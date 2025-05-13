import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/entities/user.entity'; // Adjust path as necessary

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'updated.user@example.com', description: 'User email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email?: string;

  @ApiPropertyOptional({ example: 'NewStr0ngP@ssw0rd!', description: 'User password (min 8 characters)' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password?: string; // Plain text password, will be hashed in the service if provided

  @ApiPropertyOptional({ enum: UserRole, description: 'User role' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid UserRole enum value.' })
  role?: UserRole;
} 