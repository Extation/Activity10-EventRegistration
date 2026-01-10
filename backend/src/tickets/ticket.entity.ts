import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Event } from '../events/event.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column()
  registrationId: number;

  @Column({ unique: true })
  uuid: string;

  @Column('text')
  qrCode: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Event, event => event.tickets, { onDelete: 'CASCADE' })
  event: Event;
}
