import {
  Controller,
  Get,
  Post,
  Put,
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
import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto } from '../dto';
import { Event } from './event.entity';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'Event created', type: Event })
  async create(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'List of events', type: [Event] })
  async findAll(): Promise<Event[]> {
    return this.eventService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Event details', type: Event })
  async findById(@Param('id') id: number): Promise<Event> {
    return this.eventService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: 'Event updated', type: Event })
  async update(
    @Param('id') id: number,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    return this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', type: 'number' })
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Event deleted' })
  async delete(@Param('id') id: number): Promise<void> {
    return this.eventService.delete(id);
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Get available capacity for an event' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Available capacity count' })
  async getAvailableCapacity(@Param('id') id: number): Promise<number> {
    return this.eventService.getAvailableCapacity(id);
  }
}
