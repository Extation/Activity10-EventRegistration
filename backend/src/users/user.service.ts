import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
    company?: string;
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || UserRole.ATTENDEE,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'name', 'role', 'isActive', 'phone', 'company', 'createdAt'],
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'isActive', 'phone', 'company', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
      select: ['id', 'email', 'name', 'role', 'isActive', 'phone', 'company', 'createdAt'],
    });
  }

  async update(
    id: number,
    updateData: {
      name?: string;
      email?: string;
      role?: UserRole;
      phone?: string;
      company?: string;
      isActive?: boolean;
    },
  ): Promise<User> {
    const user = await this.findById(id);

    // If email is being updated, check for conflicts
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async toggleActive(id: number): Promise<User> {
    const user = await this.findById(id);
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async delete(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async getStatistics(): Promise<{
    total: number;
    admins: number;
    organizers: number;
    attendees: number;
    active: number;
    inactive: number;
  }> {
    const [total, admins, organizers, attendees, active] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
      this.userRepository.count({ where: { role: UserRole.ORGANIZER } }),
      this.userRepository.count({ where: { role: UserRole.ATTENDEE } }),
      this.userRepository.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      admins,
      organizers,
      attendees,
      active,
      inactive: total - active,
    };
  }
}
