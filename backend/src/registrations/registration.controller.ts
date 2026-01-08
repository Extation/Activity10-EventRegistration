import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { RegisterForEventDto } from '../dto';
import { Registration } from './registration.entity';

@ApiTags('Registrations')
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('events/:eventId/register')
  @ApiOperation({ summary: 'Register user for an event' })
  @ApiParam({ name: 'eventId', type: 'number' })
  @ApiBody({ type: RegisterForEventDto })
  @ApiResponse({
    status: 201,
    description: 'Registration created',
    type: Registration,
  })
  async register(
    @Param('eventId') eventId: number,
    @Body() registerDto: RegisterForEventDto,
  ): Promise<Registration> {
    return this.registrationService.registerForEvent(eventId, registerDto);
  }

  @Get('events/:eventId')
  @ApiOperation({ summary: 'Get all registrations for an event' })
  @ApiParam({ name: 'eventId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'List of registrations',
    type: [Registration],
  })
  async getByEvent(
    @Param('eventId') eventId: number,
  ): Promise<Registration[]> {
    return this.registrationService.getRegistrationsByEvent(eventId);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get all registrations for a user' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'List of user registrations',
    type: [Registration],
  })
  async getByUser(
    @Param('userId') userId: number,
  ): Promise<Registration[]> {
    return this.registrationService.getRegistrationsByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Registration details',
    type: Registration,
  })
  async findById(@Param('id') id: number): Promise<Registration> {
    return this.registrationService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a registration' })
  @ApiParam({ name: 'id', type: 'number' })
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Registration cancelled' })
  async cancel(@Param('id') id: number): Promise<void> {
    return this.registrationService.cancelRegistration(id);
  }

  @Get('events/:eventId/count')
  @ApiOperation({ summary: 'Get registration count for an event' })
  @ApiParam({ name: 'eventId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Registration count' })
  async getCount(@Param('eventId') eventId: number): Promise<number> {
    return this.registrationService.getRegistrationCount(eventId);
  }
}
