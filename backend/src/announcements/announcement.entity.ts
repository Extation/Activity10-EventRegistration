import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Event } from '../events/event.entity';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column()
  sentBy: number;

  @Column()
  sentByName: string;

  @Column({ default: 0 })
  recipientCount: number;

  @CreateDateColumn()
  sentAt: Date;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  event: Event;
}
