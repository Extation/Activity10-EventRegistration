import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto, UpdateEventDto } from '../dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      registrationCount: 0,
      status: 'pending',
    });
    return this.eventRepository.save(event);
  }

  async findAll(): Promise<Event[]> {
    return this.eventRepository.find({
      relations: ['registrations', 'tickets'],
    });
  }

  async findById(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['registrations', 'tickets'],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    await this.findById(id);
    await this.eventRepository.update(id, updateEventDto);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.eventRepository.delete(id);
  }

  async incrementRegistrationCount(eventId: number): Promise<void> {
    const event = await this.findById(eventId);
    if (event.registrationCount >= event.capacity) {
      throw new BadRequestException('Event is at full capacity');
    }
    event.registrationCount += 1;
    await this.eventRepository.save(event);
  }

  async decrementRegistrationCount(eventId: number): Promise<void> {
    const event = await this.findById(eventId);
    if (event.registrationCount > 0) {
      event.registrationCount -= 1;
      await this.eventRepository.save(event);
    }
  }

  async getAvailableCapacity(eventId: number): Promise<number> {
    const event = await this.findById(eventId);
    return event.capacity - event.registrationCount;
  }
}
