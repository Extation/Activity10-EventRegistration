import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { EventModule } from '../events/event.module';

@Module({
  imports: [TypeOrmModule.forFeature([Registration]), EventModule],
  providers: [RegistrationService],
  controllers: [RegistrationController],
  exports: [RegistrationService],
})
export class RegistrationModule {}
