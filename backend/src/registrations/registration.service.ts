import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from './registration.entity';
import { RegisterForEventDto } from '../dto';
import { EventService } from '../events/event.service';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    private readonly eventService: EventService,
  ) {}

  async registerForEvent(
    eventId: number,
    registerDto: RegisterForEventDto,
  ): Promise<Registration> {
    // Check if user already registered for this event
    const existingRegistration = await this.registrationRepository.findOne({
      where: { eventId, userId: registerDto.userId },
    });

    if (existingRegistration) {
      throw new BadRequestException(
        'User is already registered for this event',
      );
    }

    // Check if event has capacity
    const availableCapacity =
      await this.eventService.getAvailableCapacity(eventId);
    if (availableCapacity <= 0) {
      throw new BadRequestException('Event is at full capacity');
    }

    // Create registration
    const registration = this.registrationRepository.create({
      eventId,
      ...registerDto,
      status: 'registered',
    });

    const savedRegistration = await this.registrationRepository.save(
      registration,
    );

    // Increment event registration count
    await this.eventService.incrementRegistrationCount(eventId);

    return savedRegistration;
  }

  async getRegistrationsByEvent(eventId: number): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { eventId },
      relations: ['event'],
    });
  }

  async getRegistrationsByUser(userId: number): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { userId },
      relations: ['event'],
    });
  }

  async findById(id: number): Promise<Registration> {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: ['event'],
    });
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }
    return registration;
  }

  async cancelRegistration(id: number): Promise<void> {
    const registration = await this.findById(id);
    await this.registrationRepository.delete(id);
    await this.eventService.decrementRegistrationCount(registration.eventId);
  }

  async getRegistrationCount(eventId: number): Promise<number> {
    return this.registrationRepository.count({
      where: { eventId },
    });
  }
}
