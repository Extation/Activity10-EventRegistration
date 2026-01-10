import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { EmailService } from '../email/email.service';
import { RegistrationService } from '../registrations/registration.service';
import { EventService } from '../events/event.service';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    private readonly emailService: EmailService,
    private readonly registrationService: RegistrationService,
    private readonly eventService: EventService,
  ) {}

  async create(
    eventId: number,
    subject: string,
    message: string,
    sentBy: number,
    sentByName: string,
  ): Promise<Announcement> {
    // Get event details
    const event = await this.eventService.findById(eventId);

    // Get all registrations for this event
    const registrations = await this.registrationService.getRegistrationsByEvent(eventId);

    // Extract email addresses
    const recipientEmails = registrations.map(reg => reg.userEmail);

    // Send announcement email to all attendees
    if (recipientEmails.length > 0) {
      await this.emailService.sendAnnouncementEmail(
        recipientEmails,
        subject,
        message,
        event.title,
      );
    }

    // Save announcement record
    const announcement = this.announcementRepository.create({
      eventId,
      subject,
      message,
      sentBy,
      sentByName,
      recipientCount: recipientEmails.length,
    });

    return this.announcementRepository.save(announcement);
  }

  async findByEvent(eventId: number): Promise<Announcement[]> {
    return this.announcementRepository.find({
      where: { eventId },
      order: { sentAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['event'],
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  async delete(id: number): Promise<void> {
    const announcement = await this.findById(id);
    await this.announcementRepository.remove(announcement);
  }
}
