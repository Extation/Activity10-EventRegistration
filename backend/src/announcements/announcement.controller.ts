import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnnouncementService } from './announcement.service';
import { Announcement } from './announcement.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Send announcement to event attendees (Admin/Organizer only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventId: { type: 'number' },
        subject: { type: 'string', example: 'Important Update' },
        message: { type: 'string', example: 'Event time has been changed...' },
      },
      required: ['eventId', 'subject', 'message'],
    },
  })
  @ApiResponse({ status: 201, description: 'Announcement sent successfully' })
  async create(
    @Body() body: { eventId: number; subject: string; message: string },
    @Request() req: any,
  ): Promise<Announcement> {
    return this.announcementService.create(
      body.eventId,
      body.subject,
      body.message,
      req.user.userId,
      req.user.email,
    );
  }

  @Get('events/:eventId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Get all announcements for an event (Admin/Organizer only)' })
  @ApiParam({ name: 'eventId', type: 'number' })
  @ApiResponse({ status: 200, description: 'List of announcements' })
  async findByEvent(@Param('eventId') eventId: number): Promise<Announcement[]> {
    return this.announcementService.findByEvent(eventId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Get announcement by ID (Admin/Organizer only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Announcement details' })
  async findById(@Param('id') id: number): Promise<Announcement> {
    return this.announcementService.findById(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete announcement (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Announcement deleted' })
  async delete(@Param('id') id: number): Promise<void> {
    return this.announcementService.delete(id);
  }
}
