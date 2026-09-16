import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        profile: {
          create: {}, // Profile candidat vide au départ
        },
      },
      include: {
        profile: true,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileId: user.profile?.id,
      },
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileId: user.profile?.id,
      },
      accessToken: token,
    };
  }

  async deleteAccount(userId: string) {
    const jobs = await this.prisma.exportJob.findMany({
      where: { document: { userId }, pdfPath: { not: null } },
      select: { pdfPath: true },
    });

    // Documents d'abord (relation Document -> CandidateProfile sans cascade), puis l'utilisateur (cascade sur le reste)
    await this.prisma.$transaction([
      this.prisma.document.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    for (const job of jobs) {
      fs.rm(path.join(process.cwd(), job.pdfPath!), { force: true }, () => undefined);
    }

    return { deleted: true };
  }
}
