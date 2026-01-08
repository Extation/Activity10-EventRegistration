import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async generateTicket(
    eventId: number,
    registrationId: number,
  ): Promise<Ticket> {
    const uuid = uuidv4();
    const qrCodeData = await QRCode.toDataURL(uuid);

    const ticket = this.ticketRepository.create({
      eventId,
      registrationId,
      uuid,
      qrCode: qrCodeData,
      status: 'active',
      verified: false,
    });

    return this.ticketRepository.save(ticket);
  }

  async findByUuid(uuid: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { uuid },
      relations: ['event'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with UUID ${uuid} not found`);
    }
    return ticket;
  }

  async findByRegistrationId(registrationId: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { registrationId },
      relations: ['event'],
    });
    if (!ticket) {
      throw new NotFoundException(
        `Ticket for registration ${registrationId} not found`,
      );
    }
    return ticket;
  }

  async getTicketsByEvent(eventId: number): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { eventId },
      relations: ['event'],
    });
  }

  async verifyTicket(uuid: string): Promise<Ticket> {
    const ticket = await this.findByUuid(uuid);

    if (ticket.verified) {
      throw new BadRequestException('Ticket has already been verified');
    }

    if (ticket.status !== 'active') {
      throw new BadRequestException('Ticket is not active');
    }

    ticket.verified = true;
    ticket.verifiedAt = new Date();
    ticket.status = 'checked-in';

    return this.ticketRepository.save(ticket);
  }

  async getTicketStatus(uuid: string): Promise<Ticket> {
    return this.findByUuid(uuid);
  }
}
