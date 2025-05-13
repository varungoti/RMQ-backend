import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity'; // Adjust path as necessary

export class CreateUserDto {
  @ApiProperty({ example: 'test.user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  email: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd!', description: 'User password (min 8 characters)' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @IsNotEmpty({ message: 'Password cannot be empty.' })
  password: string; // Plain text password, will be hashed in the service

  @ApiPropertyOptional({ enum: UserRole, description: 'User role (defaults to USER if not provided)' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid UserRole enum value.' })
  role?: UserRole;

  @ApiProperty({ example: 5, description: 'User grade level' })
  @IsNumber()
  @IsNotEmpty()
  gradeLevel: number;
} 