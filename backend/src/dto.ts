import { IsString, IsInt, IsPositive, IsOptional, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  date: string;

  @IsString()
  time: string;

  @IsString()
  location: string;

  @IsInt()
  @IsPositive()
  capacity: number;

  @IsOptional()
  @IsInt()
  organizerId?: number;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class RegisterForEventDto {
  @IsInt()
  userId: number;

  @IsString()
  userEmail: string;

  @IsString()
  userName: string;
}

export class TicketDto {
  @IsInt()
  eventId: number;

  @IsInt()
  registrationId: number;

  uuid: string;
  qrCode: string;
}

export class VerifyTicketDto {
  @IsString()
  uuid: string;
}
