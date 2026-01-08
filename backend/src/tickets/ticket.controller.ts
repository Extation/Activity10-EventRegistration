import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { VerifyTicketDto } from '../dto';
import { Ticket } from './ticket.entity';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a ticket for a registration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventId: { type: 'number' },
        registrationId: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket generated',
    type: Ticket,
  })
  async generateTicket(
    @Body() data: { eventId: number; registrationId: number },
  ): Promise<Ticket> {
    return this.ticketService.generateTicket(data.eventId, data.registrationId);
  }

  @Get('uuid/:uuid')
  @ApiOperation({ summary: 'Get ticket by UUID' })
  @ApiParam({ name: 'uuid', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ticket details', type: Ticket })
  async getByUuid(@Param('uuid') uuid: string): Promise<Ticket> {
    return this.ticketService.getTicketStatus(uuid);
  }

  @Get('registration/:registrationId')
  @ApiOperation({ summary: 'Get ticket by registration ID' })
  @ApiParam({ name: 'registrationId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Ticket details', type: Ticket })
  async getByRegistration(
    @Param('registrationId') registrationId: number,
  ): Promise<Ticket> {
    return this.ticketService.findByRegistrationId(registrationId);
  }

  @Get('events/:eventId')
  @ApiOperation({ summary: 'Get all tickets for an event' })
  @ApiParam({ name: 'eventId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'List of tickets',
    type: [Ticket],
  })
  async getByEvent(@Param('eventId') eventId: number): Promise<Ticket[]> {
    return this.ticketService.getTicketsByEvent(eventId);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a ticket for check-in' })
  @ApiBody({ type: VerifyTicketDto })
  @ApiResponse({
    status: 200,
    description: 'Ticket verified and checked in',
    type: Ticket,
  })
  async verifyTicket(@Body() verifyDto: VerifyTicketDto): Promise<Ticket> {
    return this.ticketService.verifyTicket(verifyDto.uuid);
  }
}
