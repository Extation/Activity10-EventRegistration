import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  providers: [TicketService],
  controllers: [TicketController],
  exports: [TicketService],
})
export class TicketModule {}
