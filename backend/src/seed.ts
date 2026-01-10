import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './users/user.service';
import { UserRole } from './users/user.entity';
import { EventService } from './events/event.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);
  const eventService = app.get(EventService);

  console.log('🌱 Seeding database...\n');

  try {
    // Create Admin Users
    console.log('Creating admin users...');
    const admin = await userService.create({
      email: 'jhanmendoza@admin.com',
      password: 'SecurePass2024!',
      name: 'Jhan Mendoza',
      role: UserRole.ADMIN,
    });
    console.log('✅ Admin created:', admin.email);

    const superAdmin = await userService.create({
      email: 'systemadmin@admin.com',
      password: 'AdminSecure2024!',
      name: 'System Administrator',
      role: UserRole.ADMIN,
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // Create Organizer User
    console.log('Creating organizer user...');
    const organizer = await userService.create({
      email: 'organizer@test.com',
      password: 'organizer123',
      name: 'Organizer User',
      role: UserRole.ORGANIZER,
    });
    console.log('✅ Organizer created:', organizer.email);

    // Create Attendee User
    console.log('Creating attendee user...');
    const attendee = await userService.create({
      email: 'attendee@test.com',
      password: 'attendee123',
      name: 'Attendee User',
      role: UserRole.ATTENDEE,
    });
    console.log('✅ Attendee created:', attendee.email);

    // Create Sample Events
    console.log('\nCreating sample events...');
    
    const event1 = await eventService.create({
      title: 'Tech Conference 2024',
      description: 'Annual technology conference featuring the latest innovations in software development, AI, and cloud computing.',
      date: '2024-12-15',
      time: '09:00',
      location: 'Convention Center, Main Hall',
      capacity: 500,
      organizerId: organizer.id,
    });
    console.log('✅ Event created:', event1.title);

    const event2 = await eventService.create({
      title: 'Web Development Workshop',
      description: 'Hands-on workshop covering React, Node.js, and modern web development practices.',
      date: '2024-12-20',
      time: '14:00',
      location: 'Tech Hub, Room 301',
      capacity: 50,
      organizerId: organizer.id,
    });
    console.log('✅ Event created:', event2.title);

    const event3 = await eventService.create({
      title: 'Startup Networking Event',
      description: 'Connect with entrepreneurs, investors, and innovators in the startup ecosystem.',
      date: '2024-12-25',
      time: '18:00',
      location: 'Innovation Center',
      capacity: 100,
      organizerId: organizer.id,
    });
    console.log('✅ Event created:', event3.title);

    console.log('\n✨ Database seeded successfully!\n');
    console.log('📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Accounts:');
    console.log('  Email: jhanmendoza@admin.com');
    console.log('  Password: SecurePass2024!');
    console.log('\n  Email: systemadmin@admin.com');
    console.log('  Password: AdminSecure2024!');
    console.log('\nOrganizer:');
    console.log('  Email: organizer@test.com');
    console.log('  Password: organizer123');
    console.log('\nAttendee:');
    console.log('  Email: attendee@test.com');
    console.log('  Password: attendee123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }

  await app.close();
}

bootstrap();
