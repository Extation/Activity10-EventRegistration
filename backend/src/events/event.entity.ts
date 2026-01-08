import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Registration } from '../registrations/registration.entity';
import { Ticket } from '../tickets/ticket.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column()
  location: string;

  @Column({ type: 'integer' })
  capacity: number;

  @Column({ type: 'integer', default: 0 })
  registrationCount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  organizerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Registration, registration => registration.event, { cascade: true })
  registrations: Registration[];

  @OneToMany(() => Ticket, ticket => ticket.event, { cascade: true })
  tickets: Ticket[];
}
