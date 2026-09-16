import { Controller, Get, NotFoundException, Param, Post, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExportService } from './export.service';

@UseGuards(JwtAuthGuard)
@Controller('documents/:id/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  async createExportJob(@Request() req: any, @Param('id') id: string) {
    return this.exportService.createExportJob(req.user.id, id);
  }

  @Get(':jobId')
  async getExportStatus(@Request() req: any, @Param('id') id: string, @Param('jobId') jobId: string) {
    const { pdfPath, ...job } = await this.exportService.getExportJobStatus(req.user.id, id, jobId);
    return job;
  }

  // Téléchargement authentifié : le PDF n'est jamais exposé publiquement
  @Get(':jobId/download')
  async downloadPdf(@Request() req: any, @Param('id') id: string, @Param('jobId') jobId: string, @Res() res: Response) {
    const job = await this.exportService.getExportJobStatus(req.user.id, id, jobId);
    if (job.status !== 'DONE' || !job.pdfPath) {
      throw new NotFoundException('Le PDF n’est pas encore prêt');
    }

    const fullPath = path.join(process.cwd(), job.pdfPath);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Fichier PDF introuvable');
    }

    const safeTitle = job.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'document';
    res.download(fullPath, `${safeTitle}.pdf`);
  }
}
