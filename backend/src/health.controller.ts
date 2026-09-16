import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

/** Sonde utilisée par l'hébergeur pour savoir si le service est vivant. */
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`select 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      return { status: 'degraded', database: 'down' };
    }
  }
}
