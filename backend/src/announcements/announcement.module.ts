import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';
import { Announcement } from './announcement.entity';
import { EmailModule } from '../email/email.module';
import { RegistrationModule } from '../registrations/registration.module';
import { EventModule } from '../events/event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]),
    EmailModule,
    RegistrationModule,
    EventModule,
  ],
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
