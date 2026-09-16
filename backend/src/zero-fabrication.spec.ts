import { BadRequestException, NotFoundException } from '@nestjs/common';
import { renderDocumentHtml } from './export/render-html';
import { DocumentsService } from './documents/documents.service';

const USER_ID = 'user-1';
const PROFILE = {
  id: 'profile-1',
  userId: USER_ID,
  headline: 'Développeur Web',
  summary: null,
  location: 'Abidjan',
  user: { fullName: 'Jean Dupont', email: 'jean@example.com', phone: null },
  experiences: [{ id: 'e1', title: 'Développeur', company: 'Katalog', description: 'Organisation des commandes' }],
  educations: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  achievements: [],
  careerGoal: null,
  suggestions: [],
};

function createPrismaMock() {
  const prisma: any = {
    document: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    documentSection: {
      create: jest.fn(async ({ data }) => ({ id: 'section-1', suggestions: [], ...data })),
      update: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    aiSuggestion: {
      create: jest.fn(async ({ data }) => ({ id: 'sugg-new', ...data })),
      update: jest.fn(async ({ data }) => data),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    candidateProfile: { findUnique: jest.fn() },
    skill: { create: jest.fn(), findUniqueOrThrow: jest.fn() },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
  };
  return prisma;
}

const aiMock = {
  generateSectionContent: jest.fn(async () => 'Texte proposé par l’IA'),
  refineSectionContent: jest.fn(async () => 'Texte reformulé par l’IA'),
  suggestHiddenSkills: jest.fn(async () => ['Organisation', 'Relation client']),
};

describe('Zero Fabrication — rendu PDF', () => {
  it("n'inclut jamais une section non confirmée (content null) dans le HTML exporté", () => {
    const html = renderDocumentHtml({
      id: 'doc-123',
      title: 'Mon CV',
      type: 'CV',
      templateId: 'ats',
      profile: { ...PROFILE, experiences: [], skills: [] },
      sections: [
        { type: 'SUMMARY', content: null, order: 1, source: 'MANUAL' },
        { type: 'EXPERIENCE_1', content: 'Fait confirmé par le candidat.', order: 2, source: 'AI_CONFIRMED' },
      ],
    });

    expect(html).not.toContain('Résumé professionnel');
    expect(html).toContain('Expérience principale');
    expect(html).toContain('Fait confirmé par le candidat.');
  });

  it('échappe le HTML saisi par le candidat', () => {
    const html = renderDocumentHtml({
      type: 'CV',
      templateId: 'modern',
      profile: { ...PROFILE, headline: '<script>alert(1)</script>' },
      sections: [],
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('Zero Fabrication — DocumentsService', () => {
  let prisma: any;
  let service: DocumentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new DocumentsService(prisma, aiMock as any);
  });

  it('générer une section crée une AiSuggestion en attente sans jamais écrire DocumentSection.content', async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      userId: USER_ID,
      type: 'CV',
      targetJob: null,
      sections: [],
      profile: PROFILE,
    });

    const result = await service.generateSectionSuggestion(USER_ID, 'doc-1', { sectionType: 'SUMMARY', order: 1 });

    expect(result.suggestion.status).toBe('PENDING_CONFIRMATION');
    expect(prisma.documentSection.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ content: null }) }),
    );
    expect(prisma.documentSection.update).not.toHaveBeenCalled();
    expect(prisma.documentSection.upsert).not.toHaveBeenCalled();
  });

  it("l'assistant IA reformule en nouvelle proposition, sans écrire dans la section", async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      userId: USER_ID,
      type: 'CV',
      sections: [{ id: 'section-1', type: 'SUMMARY', content: 'Texte déjà validé.', suggestions: [] }],
      profile: PROFILE,
    });

    const { suggestion } = await service.refineSection(USER_ID, 'doc-1', {
      sectionType: 'SUMMARY',
      instruction: 'Rends-le plus court',
    });

    expect(suggestion.status).toBe('PENDING_CONFIRMATION');
    expect(suggestion.generatedContent).toBe('Texte reformulé par l’IA');
    expect(prisma.documentSection.update).not.toHaveBeenCalled();
    expect(prisma.documentSection.upsert).not.toHaveBeenCalled();
  });

  it("l'assistant IA refuse de reformuler une section vide", async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      userId: USER_ID,
      type: 'CV',
      sections: [{ id: 'section-1', type: 'SUMMARY', content: null, suggestions: [] }],
      profile: PROFILE,
    });

    await expect(
      service.refineSection(USER_ID, 'doc-1', { sectionType: 'SUMMARY', instruction: 'Rends-le plus court' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(aiMock.refineSectionContent).not.toHaveBeenCalled();
  });

  it('suggérer des compétences ne crée jamais de Skill', async () => {
    prisma.candidateProfile.findUnique.mockResolvedValue(PROFILE);

    const created = await service.suggestHiddenSkills(USER_ID);

    expect(created).toHaveLength(2);
    expect(created.every((s: any) => s.status === 'PENDING_CONFIRMATION' && s.kind === 'HIDDEN_SKILL')).toBe(true);
    expect(prisma.skill.create).not.toHaveBeenCalled();
  });

  it('refuse de suggérer des compétences sans aucune expérience saisie', async () => {
    prisma.candidateProfile.findUnique.mockResolvedValue({ ...PROFILE, experiences: [] });
    await expect(service.suggestHiddenSkills(USER_ID)).rejects.toBeInstanceOf(BadRequestException);
    expect(aiMock.suggestHiddenSkills).not.toHaveBeenCalled();
  });

  it('rejeter une compétence suggérée ne crée pas de Skill', async () => {
    prisma.candidateProfile.findUnique.mockResolvedValue(PROFILE);
    prisma.aiSuggestion.findUnique.mockResolvedValue({
      id: 's1',
      kind: 'HIDDEN_SKILL',
      profileId: PROFILE.id,
      status: 'PENDING_CONFIRMATION',
      generatedContent: 'Organisation',
    });

    await service.confirmSkillSuggestion(USER_ID, { suggestionId: 's1', action: 'REJECT' });
    expect(prisma.skill.create).not.toHaveBeenCalled();
  });

  it("une suggestion déjà traitée ne peut pas être confirmée une seconde fois", async () => {
    prisma.candidateProfile.findUnique.mockResolvedValue(PROFILE);
    prisma.aiSuggestion.findUnique.mockResolvedValue({
      id: 's1',
      kind: 'HIDDEN_SKILL',
      profileId: PROFILE.id,
      status: 'REJECTED',
      generatedContent: 'Organisation',
    });

    await expect(service.confirmSkillSuggestion(USER_ID, { suggestionId: 's1', action: 'CONFIRM' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.skill.create).not.toHaveBeenCalled();
  });

  it("refuse de confirmer une suggestion appartenant à un autre document", async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      userId: USER_ID,
      type: 'CV',
      sections: [],
      profile: PROFILE,
    });
    prisma.aiSuggestion.findUnique.mockResolvedValue({
      id: 'foreign',
      kind: 'SECTION_CONTENT',
      status: 'PENDING_CONFIRMATION',
      generatedContent: 'Texte d’un autre utilisateur',
      section: { id: 'other-section', documentId: 'doc-OTHER' },
    });

    await expect(
      service.confirmSectionSuggestion(USER_ID, 'doc-1', { suggestionId: 'foreign', action: 'CONFIRM' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.documentSection.update).not.toHaveBeenCalled();
  });
});
