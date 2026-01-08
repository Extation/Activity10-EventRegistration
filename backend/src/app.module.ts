import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { EventModule } from './events/event.module';
import { RegistrationModule } from './registrations/registration.module';
import { TicketModule } from './tickets/ticket.module';
import { Event } from './events/event.entity';
import { Registration } from './registrations/registration.entity';
import { Ticket } from './tickets/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || './event-registration.db',
      entities: [Event, Registration, Ticket],
      synchronize: true,
      logging: false,
    }),
    EventModule,
    RegistrationModule,
    TicketModule,
  ],
})
export class AppModule {
  static setupSwagger(app: any) {
    const config = new DocumentBuilder()
      .setTitle('Event Registration & QR Scanner API')
      .setDescription('API for event management, registration, and ticket verification')
      .setVersion('1.0')
      .addTag('Events', 'Event management endpoints')
      .addTag('Registrations', 'User registration endpoints')
      .addTag('Tickets', 'Ticket and QR verification endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }
}
