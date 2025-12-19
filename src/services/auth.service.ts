import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';

export interface RegisterData {
  email?: string;
  nip?: string; // For TEACHER
  nis?: string; // For STUDENT
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  bio?: string;
  birthdate?: Date;
  classId?: string;
}

export interface LoginData {
  identifier: string; // NIP for TEACHER, NIS for STUDENT
  password: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async register(data: RegisterData) {
    // Validate: Student must have NIS
    if (data.role === UserRole.STUDENT && !data.nis) {
      throw new Error('Student must have NIS');
    }

    // Validate: Teacher must have NIP
    if (data.role === UserRole.TEACHER && !data.nip) {
      throw new Error('Teacher must have NIP');
    }

    // Validate: NIS only for students
    if (data.nis && data.role !== UserRole.STUDENT) {
      throw new Error('NIS is only allowed for students');
    }

    // Validate: NIP only for teachers
    if (data.nip && data.role !== UserRole.TEACHER) {
      throw new Error('NIP is only allowed for teachers');
    }

    // Check if NIP already exists
    if (data.nip) {
      const existingNIP = await prisma.user.findUnique({
        where: { nip: data.nip },
      });
      if (existingNIP) {
        throw new Error('NIP already exists');
      }
    }

    // Check if NIS already exists
    if (data.nis) {
      const existingNIS = await prisma.user.findUnique({
        where: { nis: data.nis },
      });
      if (existingNIS) {
        throw new Error('NIS already exists');
      }
    }

    // Check if email already exists (optional)
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        nip: data.nip,
        nis: data.nis,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        phone: data.phone,
        address: data.address,
        bio: data.bio,
        birthdate: data.birthdate,
        classId: data.classId,
      },
      select: {
        id: true,
        email: true,
        nip: true,
        nis: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    logger.info({ userId: user.id, role: user.role }, 'User registered');
    return user;
  }

  async login(data: LoginData) {
    // Find user by NIP (for teachers) or NIS (for students)
    let user = null;

    // Try NIP first (for teachers)
    user = await prisma.user.findUnique({
      where: { nip: data.identifier },
    });

    // If not found, try NIS (for students)
    if (!user) {
      user = await prisma.user.findUnique({
        where: { nis: data.identifier },
      });
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    logger.info({ userId: user.id, role: user.role }, 'User logged in');

    return {
      id: user.id,
      email: user.email,
      nip: user.nip,
      nis: user.nis,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nip: true,
        nis: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        address: true,
        bio: true,
        birthdate: true,
        className: true,
        classId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export default new AuthService();

