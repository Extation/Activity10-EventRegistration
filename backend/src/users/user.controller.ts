import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { User, UserRole } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
        name: { type: 'string', example: 'John Doe' },
        role: { type: 'string', enum: ['admin', 'organizer', 'attendee'] },
        phone: { type: 'string', example: '+1234567890' },
        company: { type: 'string', example: 'Tech Corp' },
      },
      required: ['email', 'password', 'name'],
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(
    @Body()
    userData: {
      email: string;
      password: string;
      name: string;
      role?: UserRole;
      phone?: string;
      company?: string;
    },
  ): Promise<User> {
    return this.userService.create(userData);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getStatistics(): Promise<any> {
    return this.userService.getStatistics();
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get users by role (Admin only)' })
  @ApiParam({ name: 'role', enum: UserRole })
  @ApiResponse({ status: 200, description: 'List of users with specified role' })
  async findByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.userService.findByRole(role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'User details' })
  async findById(@Param('id') id: number): Promise<User> {
    return this.userService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['admin', 'organizer', 'attendee'] },
        phone: { type: 'string' },
        company: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(
    @Param('id') id: number,
    @Body()
    updateData: {
      name?: string;
      email?: string;
      role?: UserRole;
      phone?: string;
      company?: string;
      isActive?: boolean;
    },
  ): Promise<User> {
    return this.userService.update(id, updateData);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle user active status (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'User status toggled' })
  async toggleActive(@Param('id') id: number): Promise<User> {
    return this.userService.toggleActive(id);
  }

  @Put(':id/password')
  @ApiOperation({ summary: 'Update user password' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newPassword: { type: 'string' },
      },
      required: ['newPassword'],
    },
  })
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Password updated successfully' })
  async updatePassword(
    @Param('id') id: number,
    @Body() body: { newPassword: string },
  ): Promise<void> {
    return this.userService.updatePassword(id, body.newPassword);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async delete(@Param('id') id: number): Promise<void> {
    return this.userService.delete(id);
  }
}
