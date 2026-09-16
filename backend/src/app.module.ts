import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { AiGenerationModule } from './ai-generation/ai-generation.module';
import { DocumentsModule } from './documents/documents.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    AiGenerationModule,
    DocumentsModule,
    ExportModule,
  ],
})
export class AppModule {}
