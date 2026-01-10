import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { EmailService } from '../email/email.service';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly emailService: EmailService,
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

    const savedTicket = await this.ticketRepository.save(ticket);

    // Send check-in confirmation email
    try {
      // Get registration details to get user email
      const ticketWithRelations = await this.ticketRepository.findOne({
        where: { id: savedTicket.id },
        relations: ['event'],
      });

      if (ticketWithRelations && ticketWithRelations.event) {
        // Get registration to find user email
        const registration = await this.ticketRepository.manager
          .getRepository('Registration')
          .findOne({ where: { id: ticketWithRelations.registrationId } });

        if (registration) {
          await this.emailService.sendCheckInConfirmation(
            registration.userEmail,
            registration.userName,
            ticketWithRelations.event.title,
            ticketWithRelations.event.date,
            ticketWithRelations.event.time,
            ticketWithRelations.event.location,
            savedTicket.verifiedAt.toLocaleString(),
          );
        }
      }
    } catch (emailError) {
      console.error('Failed to send check-in email:', emailError);
      // Don't fail the verification if email fails
    }

    return savedTicket;
  }

  async getTicketStatus(uuid: string): Promise<Ticket> {
    return this.findByUuid(uuid);
  }
}
