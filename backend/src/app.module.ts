import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { EventModule } from './events/event.module';
import { RegistrationModule } from './registrations/registration.module';
import { TicketModule } from './tickets/ticket.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { AnnouncementModule } from './announcements/announcement.module';
import { Event } from './events/event.entity';
import { Registration } from './registrations/registration.entity';
import { Ticket } from './tickets/ticket.entity';
import { User } from './users/user.entity';
import { Announcement } from './announcements/announcement.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || './event-registration.db',
      entities: [Event, Registration, Ticket, User, Announcement],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UserModule,
    EventModule,
    RegistrationModule,
    TicketModule,
    EmailModule,
    AnnouncementModule,
  ],
})
export class AppModule {
  static setupSwagger(app: any) {
    const config = new DocumentBuilder()
      .setTitle('Event Registration & QR Scanner API')
      .setDescription('API for event management, registration, and ticket verification with authentication')
      .setVersion('2.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'User authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Events', 'Event management endpoints')
      .addTag('Registrations', 'User registration endpoints')
      .addTag('Tickets', 'Ticket and QR verification endpoints')
      .addTag('Announcements', 'Event announcement endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }
}
