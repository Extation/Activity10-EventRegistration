import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { Event } from '../events/event.entity';

@Entity('registrations')
@Unique(['eventId', 'userId'])
export class Registration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column()
  userId: number;

  @Column({ default: 'registered' })
  status: string;

  @Column()
  userEmail: string;

  @Column()
  userName: string;

  @CreateDateColumn()
  registeredAt: Date;

  @ManyToOne(() => Event, event => event.registrations)
  event: Event;
}
