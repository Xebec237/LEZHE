import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiGenerationService } from '../ai-generation/ai-generation.service';
import {
  ConfirmSuggestionDto,
  CreateDocumentDto,
  GenerateSectionDto,
  ManualSectionDto,
  RefineSectionDto,
} from './dto/documents.dto';

// Sections qui doivent être confirmées avant qu'un document puisse être exporté.
// Source de vérité côté backend : le frontend ne fait que refléter cette règle.
export const ESSENTIAL_SECTIONS: Record<DocumentType, string[]> = {
  CV: ['SUMMARY'],
  COVER_LETTER: ['COVER_LETTER_BODY'],
  RECOMMENDATION_LETTER: ['RECOMMENDATION_LETTER_BODY'],
};

export function hasConfirmedContent(section: { content: string | null } | undefined): boolean {
  return !!section?.content && section.content.trim() !== '';
}

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private aiGenerationService: AiGenerationService,
  ) {}

  async createDocument(userId: string, dto: CreateDocumentDto) {
    const userProfile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    if (!userProfile) throw new NotFoundException('Profil candidat introuvable');

    return this.prisma.document.create({
      data: {
        userId,
        profileId: userProfile.id,
        type: dto.type,
        title: dto.title,
        templateId: dto.templateId || 'ats',
        targetJob: dto.targetJob,
        targetCountry: dto.targetCountry,
        language: dto.language || 'fr',
      },
      include: {
        sections: true,
      },
    });
  }

  async getUserDocuments(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        sections: { select: { type: true, content: true } },
        exportJobs: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getDocumentById(userId: string, id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            suggestions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
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
        exportJobs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.userId !== userId) throw new ForbiddenException('Accès refusé');

    return {
      ...doc,
      essentialSections: ESSENTIAL_SECTIONS[doc.type],
      canExport: this.essentialSectionsConfirmed(doc.type, doc.sections),
    };
  }

  async updateDocument(userId: string, id: string, data: { title?: string; templateId?: string; targetJob?: string; targetCountry?: string }) {
    await this.getDocumentById(userId, id);
    return this.prisma.document.update({ where: { id }, data });
  }

  async deleteDocument(userId: string, id: string) {
    const doc = await this.getDocumentById(userId, id);
    return this.prisma.document.delete({ where: { id: doc.id } });
  }

  essentialSectionsConfirmed(type: DocumentType, sections: { type: string; content: string | null }[]): boolean {
    return ESSENTIAL_SECTIONS[type].every((t) => hasConfirmedContent(sections.find((s) => s.type === t)));
  }

  // Met à jour le statut DRAFT <-> READY en fonction des sections confirmées (jamais EXPORTED -> DRAFT)
  private async refreshDocumentStatus(documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { sections: { select: { type: true, content: true } } },
    });
    if (!doc || doc.status === 'EXPORTED') return;
    const status = this.essentialSectionsConfirmed(doc.type, doc.sections) ? 'READY' : 'DRAFT';
    if (status !== doc.status) {
      await this.prisma.document.update({ where: { id: documentId }, data: { status } });
    }
  }

  // Extrait figé et exact des faits du profil (preuve d'audit, seule matière autorisée pour l'IA)
  private buildFactsSnapshot(doc: Awaited<ReturnType<DocumentsService['getDocumentById']>>) {
    return {
      profile: {
        fullName: doc.profile.user.fullName,
        headline: doc.profile.headline,
        summary: doc.profile.summary,
        location: doc.profile.location,
        careerGoal: doc.profile.careerGoal,
      },
      experiences: doc.profile.experiences.map((e) => ({
        title: e.title,
        company: e.company,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        isCurrent: e.isCurrent,
        description: e.description,
      })),
      educations: doc.profile.educations.map((e) => ({
        school: e.school,
        degree: e.degree,
        field: e.field,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
      skills: doc.profile.skills.map((s) => ({ name: s.name, level: s.level })),
      languages: doc.profile.languages.map((l) => ({ name: l.name, level: l.level })),
      certifications: doc.profile.certifications.map((c) => ({ name: c.name, issuer: c.issuer, issuedAt: c.issuedAt })),
      projects: doc.profile.projects.map((p) => ({ name: p.name, description: p.description, url: p.url })),
      achievements: doc.profile.achievements.map((a) => ({ title: a.title, description: a.description })),
      target: { job: doc.targetJob, country: doc.targetCountry },
    };
  }

  // ÉTAPE 1 : génère une AiSuggestion. Ne touche JAMAIS à DocumentSection.content.
  async generateSectionSuggestion(userId: string, documentId: string, dto: GenerateSectionDto) {
    const doc = await this.getDocumentById(userId, documentId);
    const factsSnapshot = this.buildFactsSnapshot(doc);

    let section = doc.sections.find((s) => s.type === dto.sectionType);
    if (!section) {
      section = await this.prisma.documentSection.create({
        data: {
          documentId,
          type: dto.sectionType,
          order: dto.order,
          content: null, // garde-fou Zero Fabrication
        },
        include: { suggestions: true },
      });
    }

    const generatedText = await this.aiGenerationService.generateSectionContent(
      dto.sectionType,
      doc.targetJob,
      factsSnapshot,
    );

    // Une seule proposition en attente par section : les anciennes sont rejetées
    await this.prisma.aiSuggestion.updateMany({
      where: { sectionId: section.id, status: 'PENDING_CONFIRMATION' },
      data: { status: 'REJECTED', reviewedAt: new Date() },
    });

    const suggestion = await this.prisma.aiSuggestion.create({
      data: {
        sectionId: section.id,
        kind: 'SECTION_CONTENT',
        generatedContent: generatedText,
        sourceFactsSnapshot: JSON.parse(JSON.stringify(factsSnapshot)),
        status: 'PENDING_CONFIRMATION',
      },
    });

    return { sectionId: section.id, suggestion };
  }

  /**
   * Assistant IA de l'éditeur : reformule une section déjà rédigée.
   * Le résultat est une nouvelle AiSuggestion en attente — jamais un contenu final.
   */
  async refineSection(userId: string, documentId: string, dto: RefineSectionDto) {
    const doc = await this.getDocumentById(userId, documentId);
    const section = doc.sections.find((s) => s.type === dto.sectionType);
    const pending = section?.suggestions.find((s) => s.status === 'PENDING_CONFIRMATION');
    const baseText = pending?.generatedContent ?? section?.content;

    if (!section || !baseText) {
      throw new BadRequestException('Génère ou écris d’abord un texte pour cette section.');
    }

    const factsSnapshot = this.buildFactsSnapshot(doc);
    const refined = await this.aiGenerationService.refineSectionContent(baseText, dto.instruction, factsSnapshot);

    await this.prisma.aiSuggestion.updateMany({
      where: { sectionId: section.id, status: 'PENDING_CONFIRMATION' },
      data: { status: 'REJECTED', reviewedAt: new Date() },
    });

    const suggestion = await this.prisma.aiSuggestion.create({
      data: {
        sectionId: section.id,
        kind: 'SECTION_CONTENT',
        generatedContent: refined,
        sourceFactsSnapshot: JSON.parse(JSON.stringify({ ...factsSnapshot, refinedFrom: baseText, instruction: dto.instruction })),
        status: 'PENDING_CONFIRMATION',
      },
    });

    return { sectionId: section.id, suggestion };
  }

  // ÉTAPE 2 : SEULE route qui peut écrire DocumentSection.content à partir d'une suggestion.
  async confirmSectionSuggestion(userId: string, documentId: string, dto: ConfirmSuggestionDto) {
    await this.getDocumentById(userId, documentId);

    const suggestion = await this.prisma.aiSuggestion.findUnique({
      where: { id: dto.suggestionId },
      include: { section: true },
    });

    // La suggestion doit appartenir à une section de CE document (lui-même vérifié comme appartenant à l'utilisateur)
    if (!suggestion || suggestion.kind !== 'SECTION_CONTENT' || suggestion.section?.documentId !== documentId) {
      throw new NotFoundException('Suggestion introuvable');
    }
    if (suggestion.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException('Cette proposition a déjà été traitée');
    }

    const reviewedAt = new Date();

    if (dto.action === 'CONFIRM') {
      await this.prisma.$transaction([
        this.prisma.documentSection.update({
          where: { id: suggestion.section.id },
          data: { content: suggestion.generatedContent, source: 'AI_CONFIRMED' },
        }),
        this.prisma.aiSuggestion.update({
          where: { id: suggestion.id },
          data: { status: 'CONFIRMED', reviewedAt },
        }),
      ]);
    } else if (dto.action === 'EDIT') {
      const edited = dto.editedContent?.trim();
      if (!edited) throw new BadRequestException('Le contenu modifié est obligatoire');
      await this.prisma.$transaction([
        this.prisma.documentSection.update({
          where: { id: suggestion.section.id },
          data: { content: edited, source: 'AI_EDITED' },
        }),
        this.prisma.aiSuggestion.update({
          where: { id: suggestion.id },
          data: { status: 'EDITED', editedContent: edited, reviewedAt },
        }),
      ]);
    } else {
      await this.prisma.aiSuggestion.update({
        where: { id: suggestion.id },
        data: { status: 'REJECTED', reviewedAt },
      });
    }

    await this.refreshDocumentStatus(documentId);

    return this.prisma.documentSection.findUnique({
      where: { id: suggestion.section.id },
      include: { suggestions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  // Écriture manuelle d'une section, sans IA
  async updateSectionManual(userId: string, documentId: string, dto: ManualSectionDto) {
    await this.getDocumentById(userId, documentId);
    const content = dto.content.trim() === '' ? null : dto.content.trim();

    const section = await this.prisma.documentSection.upsert({
      where: {
        documentId_type: {
          documentId,
          type: dto.sectionType,
        },
      },
      create: {
        documentId,
        type: dto.sectionType,
        order: dto.order,
        content,
        source: 'MANUAL',
      },
      update: {
        content,
        source: 'MANUAL',
      },
    });

    await this.refreshDocumentStatus(documentId);
    return section;
  }

  // Suggestion de compétences cachées : crée des AiSuggestion HIDDEN_SKILL, JAMAIS de Skill.
  async suggestHiddenSkills(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        experiences: true,
        skills: true,
        suggestions: { where: { kind: 'HIDDEN_SKILL' } },
      },
    });
    if (!profile) throw new NotFoundException('Profil introuvable');

    // Zero Fabrication : sans expérience saisie, il n'existe aucun fait dont déduire une compétence
    if (profile.experiences.length === 0) {
      throw new BadRequestException(
        "Ajoute d'abord au moins une expérience à ton profil : Lezhe ne peut déduire des compétences qu'à partir de ce que tu as raconté.",
      );
    }

    const experiencesSnapshot = profile.experiences.map((e) => ({
      title: e.title,
      company: e.company,
      description: e.description,
    }));

    const suggestedNames = await this.aiGenerationService.suggestHiddenSkills(experiencesSnapshot);

    // On ne repropose ni une compétence déjà confirmée, ni une déjà en attente, ni une déjà retirée
    const known = new Set([
      ...profile.skills.map((s) => s.name.toLowerCase()),
      ...profile.suggestions.map((s) => s.generatedContent.toLowerCase()),
    ]);

    const created = [];
    for (const rawName of suggestedNames) {
      const name = rawName.trim();
      if (!name || known.has(name.toLowerCase())) continue;
      known.add(name.toLowerCase());

      created.push(
        await this.prisma.aiSuggestion.create({
          data: {
            profileId: profile.id,
            kind: 'HIDDEN_SKILL',
            generatedContent: name,
            sourceFactsSnapshot: experiencesSnapshot,
            status: 'PENDING_CONFIRMATION',
          },
        }),
      );
    }

    return created;
  }

  // SEULE route qui peut créer un Skill à partir d'une suggestion
  async confirmSkillSuggestion(userId: string, dto: ConfirmSuggestionDto) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: { skills: true },
    });
    if (!profile) throw new NotFoundException('Profil introuvable');

    const suggestion = await this.prisma.aiSuggestion.findUnique({
      where: { id: dto.suggestionId },
    });

    if (!suggestion || suggestion.kind !== 'HIDDEN_SKILL' || suggestion.profileId !== profile.id) {
      throw new NotFoundException('Suggestion de compétence introuvable');
    }
    if (suggestion.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException('Cette proposition a déjà été traitée');
    }

    const reviewedAt = new Date();

    if (dto.action === 'REJECT') {
      return this.prisma.aiSuggestion.update({
        where: { id: suggestion.id },
        data: { status: 'REJECTED', reviewedAt },
      });
    }

    const name = dto.action === 'EDIT' ? dto.editedContent?.trim() : suggestion.generatedContent;
    if (!name) throw new BadRequestException('Le nom de la compétence est obligatoire');

    const existing = profile.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());

    const [skill] = await this.prisma.$transaction([
      existing
        ? this.prisma.skill.findUniqueOrThrow({ where: { id: existing.id } })
        : this.prisma.skill.create({ data: { profileId: profile.id, name, level: 'INTERMEDIATE' } }),
      this.prisma.aiSuggestion.update({
        where: { id: suggestion.id },
        data:
          dto.action === 'EDIT'
            ? { status: 'EDITED', editedContent: name, reviewedAt }
            : { status: 'CONFIRMED', reviewedAt },
      }),
    ]);

    return skill;
  }

  async getSkillSuggestions(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profil introuvable');

    return this.prisma.aiSuggestion.findMany({
      where: {
        profileId: profile.id,
        kind: 'HIDDEN_SKILL',
        status: 'PENDING_CONFIRMATION',
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
