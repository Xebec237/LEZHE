import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';
import { PrismaService } from '../prisma/prisma.service';
import { ESSENTIAL_SECTIONS, hasConfirmedContent } from '../documents/documents.service';
import { renderDocumentHtml } from './render-html';

const QUEUE_NAME = 'pdf-export';
const PDF_DIR = path.join('uploads', 'pdf');

@Injectable()
export class ExportService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExportService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const connection = {
      host: this.config.get<string>('REDIS_HOST') || 'localhost',
      port: Number(this.config.get('REDIS_PORT') || 6379),
      maxRetriesPerRequest: null,
    };

    if (!(await this.isRedisReachable(connection.host, connection.port))) {
      this.logger.warn(
        `Redis injoignable sur ${connection.host}:${connection.port} : les PDF seront rendus directement (sans file BullMQ).`,
      );
      return;
    }

    this.queue = new Queue(QUEUE_NAME, { connection });
    this.worker = new Worker(QUEUE_NAME, async (job) => this.processExportJob(job.data.exportJobId), {
      connection,
      concurrency: 2,
    });
    this.worker.on('error', (err) => this.logger.warn(`Worker PDF : ${err.message}`));
    this.queue.on('error', (err) => this.logger.warn(`File PDF : ${err.message}`));
    this.logger.log('File BullMQ « pdf-export » active');
  }

  private async isRedisReachable(host: string, port: number): Promise<boolean> {
    const client = new IORedis({
      host,
      port,
      lazyConnect: true,
      connectTimeout: 1500,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
    });
    client.on('error', () => undefined);
    try {
      await client.connect();
      await client.ping();
      return true;
    } catch {
      return false;
    } finally {
      client.disconnect();
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  async createExportJob(userId: string, documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { sections: { select: { type: true, content: true } } },
    });

    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.userId !== userId) throw new ForbiddenException('Accès refusé');

    // Vérification finale côté backend : jamais d'export sans les sections essentielles confirmées
    const missing = ESSENTIAL_SECTIONS[doc.type].filter(
      (t) => !hasConfirmedContent(doc.sections.find((s) => s.type === t)),
    );
    if (missing.length > 0) {
      throw new BadRequestException('Valide d’abord les sections essentielles de ton document avant de l’exporter.');
    }

    const exportJob = await this.prisma.exportJob.create({
      data: { documentId, status: 'QUEUED' },
    });

    if (this.queue) {
      await this.queue.add(
        'render',
        { exportJobId: exportJob.id },
        { jobId: exportJob.id, removeOnComplete: 100, removeOnFail: 100 },
      );
    } else {
      // Mode sans Redis (dev local sans Docker) : rendu direct en arrière-plan de la requête
      this.processExportJob(exportJob.id).catch(() => undefined);
    }

    return exportJob;
  }

  async getExportJobStatus(userId: string, documentId: string, jobId: string) {
    const job = await this.prisma.exportJob.findUnique({
      where: { id: jobId },
      include: { document: { select: { userId: true, title: true } } },
    });

    if (!job || job.documentId !== documentId) throw new NotFoundException('Export introuvable');
    if (job.document.userId !== userId) throw new ForbiddenException('Accès refusé');

    return {
      id: job.id,
      documentId: job.documentId,
      status: job.status,
      errorMessage: job.status === 'FAILED' ? 'La génération du PDF a échoué. Réessaie dans un instant.' : null,
      createdAt: job.createdAt,
      finishedAt: job.finishedAt,
      title: job.document.title,
      pdfPath: job.pdfPath,
    };
  }

  private async processExportJob(exportJobId: string) {
    const exportJob = await this.prisma.exportJob.findUnique({ where: { id: exportJobId } });
    if (!exportJob || exportJob.status === 'DONE') return;

    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: { status: 'PROCESSING' },
    });

    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
    try {
      const doc = await this.prisma.document.findUnique({
        where: { id: exportJob.documentId },
        include: {
          sections: true,
          profile: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
              experiences: { orderBy: { startDate: 'desc' } },
              educations: { orderBy: { startDate: 'desc' } },
              skills: { orderBy: { name: 'asc' } },
              languages: { orderBy: { name: 'asc' } },
              certifications: { orderBy: { name: 'asc' } },
              projects: { orderBy: { name: 'asc' } },
              achievements: { orderBy: { title: 'asc' } },
            },
          },
        },
      });
      if (!doc) throw new Error('Document introuvable');

      const html = renderDocumentHtml(doc);

      const absoluteDir = path.join(process.cwd(), PDF_DIR);
      fs.mkdirSync(absoluteDir, { recursive: true });
      const filename = `lezhe-${doc.id}-${Date.now()}.pdf`;

      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.pdf({
        path: path.join(absoluteDir, filename),
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true,
      });

      await this.prisma.$transaction([
        this.prisma.exportJob.update({
          where: { id: exportJobId },
          data: { status: 'DONE', pdfPath: path.posix.join('uploads', 'pdf', filename), finishedAt: new Date() },
        }),
        this.prisma.document.update({
          where: { id: doc.id },
          data: { status: 'EXPORTED' },
        }),
      ]);
    } catch (err: any) {
      this.logger.error(`Échec du rendu PDF (export ${exportJobId}) : ${err.message}`);
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: { status: 'FAILED', errorMessage: err.message || 'Erreur inconnue', finishedAt: new Date() },
      });
    } finally {
      await browser?.close();
    }
  }
}
