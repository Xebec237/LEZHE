import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connecté à PostgreSQL');
    } catch (err: any) {
      this.logger.warn(`Impossible de se connecter à PostgreSQL pour le moment: ${err.message}. Lance d'abord 'docker compose up -d' à la racine du projet`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
