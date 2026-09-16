import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import {
  ConfirmSuggestionDto,
  CreateDocumentDto,
  GenerateSectionDto,
  ManualSectionDto,
  RefineSectionDto,
  UpdateDocumentDto,
} from './dto/documents.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('documents')
  async createDocument(@Request() req: any, @Body() dto: CreateDocumentDto) {
    return this.documentsService.createDocument(req.user.id, dto);
  }

  @Get('documents')
  async getUserDocuments(@Request() req: any) {
    return this.documentsService.getUserDocuments(req.user.id);
  }

  @Get('documents/:id')
  async getDocumentById(@Request() req: any, @Param('id') id: string) {
    return this.documentsService.getDocumentById(req.user.id, id);
  }

  @Patch('documents/:id')
  async updateDocument(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.updateDocument(req.user.id, id, dto);
  }

  @Delete('documents/:id')
  async deleteDocument(@Request() req: any, @Param('id') id: string) {
    return this.documentsService.deleteDocument(req.user.id, id);
  }

  @Post('documents/:id/sections/generate')
  async generateSectionSuggestion(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: GenerateSectionDto,
  ) {
    return this.documentsService.generateSectionSuggestion(req.user.id, id, dto);
  }

  @Post('documents/:id/sections/confirm')
  async confirmSectionSuggestion(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ConfirmSuggestionDto,
  ) {
    return this.documentsService.confirmSectionSuggestion(req.user.id, id, dto);
  }

  @Post('documents/:id/sections/refine')
  async refineSection(@Request() req: any, @Param('id') id: string, @Body() dto: RefineSectionDto) {
    return this.documentsService.refineSection(req.user.id, id, dto);
  }

  @Post('documents/:id/sections/manual')
  async updateSectionManual(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ManualSectionDto,
  ) {
    return this.documentsService.updateSectionManual(req.user.id, id, dto);
  }

  @Post('profile/skills/suggest')
  async suggestHiddenSkills(@Request() req: any) {
    return this.documentsService.suggestHiddenSkills(req.user.id);
  }

  @Get('profile/skills/suggested')
  async getSkillSuggestions(@Request() req: any) {
    return this.documentsService.getSkillSuggestions(req.user.id);
  }

  @Post('profile/skills/confirm')
  async confirmSkillSuggestion(@Request() req: any, @Body() dto: ConfirmSuggestionDto) {
    return this.documentsService.confirmSkillSuggestion(req.user.id, dto);
  }
}
