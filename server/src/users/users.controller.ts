import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto'; // Assuming DTO path
import { UpdateUserDto } from '../dto/update-user.dto'; // Assuming DTO path (needs creation)
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust path as needed
import { RolesGuard } from '../guards/roles.guard'; // Adjust path as needed
import { Roles } from '../decorators/roles.decorator'; // Adjust path as needed
import { UserRole, User } from '../entities/user.entity'; // Import User entity
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

// Note: This controller currently only handles Admin operations.
// A separate controller might be needed for public user creation (registration) if requirements differ.
@ApiTags('Users (Admin)') 
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /users - Should be public for user creation/registration
  // Removing @UseGuards, @Roles, and @ApiBearerAuth from this endpoint
  @Post()
  @ApiOperation({ summary: 'Create a new user (Public Registration or Admin Creation)' })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully. Response excludes password hash.',
    type: User 
  }) 
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed.' })
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    // If this is ONLY for admin creation, it should be moved/protected differently.
    // Assuming it can also serve as public registration for now.
    return this.usersService.create(createUserDto); 
  }

  // --- Protected Admin Endpoints --- 

  @Get()
  @ApiBearerAuth() // Apply Auth decorator to protected routes
  @UseGuards(JwtAuthGuard, RolesGuard) // Restore RolesGuard
  @Roles(UserRole.ADMIN) // Restore Roles decorator
  @ApiOperation({ summary: 'Get all users (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users. Response excludes password hashes.',
    type: User,
    isArray: true 
  }) 
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' }) // Add 401 for guarded routes
  findAll() {
    return this.usersService.findAll(); 
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single user by ID (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'User details. Response excludes password hash.',
    type: User 
  }) 
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' }) // Add 401 for guarded routes
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id); 
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully. Response excludes password hash.',
    type: User 
  }) 
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists for another user.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' }) // Add 401 for guarded routes
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto, 
  ) {
    return this.usersService.update(id, updateUserDto); 
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', type: String })
  @ApiResponse({ status: 204, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' }) // Add 401 for guarded routes
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id); 
  }
}
