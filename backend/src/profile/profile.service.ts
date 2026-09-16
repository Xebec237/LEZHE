import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAchievementDto,
  CreateCertificationDto,
  CreateEducationDto,
  CreateExperienceDto,
  CreateLanguageDto,
  CreateProjectDto,
  CreateSkillDto,
  UpdateProfileDto,
} from './dto/profile.dto';

const PROFILE_INCLUDE = {
  user: { select: { fullName: true, email: true, phone: true } },
  experiences: { orderBy: { startDate: 'desc' as const } },
  educations: { orderBy: { startDate: 'desc' as const } },
  skills: { orderBy: { name: 'asc' as const } },
  languages: { orderBy: { name: 'asc' as const } },
  certifications: { orderBy: { name: 'asc' as const } },
  projects: { orderBy: { name: 'asc' as const } },
  achievements: { orderBy: { title: 'asc' as const } },
};

// Collections du profil qui partagent le même CRUD simple (ajout / suppression)
export const PROFILE_COLLECTIONS = ['skills', 'languages', 'certifications', 'projects', 'achievements'] as const;
export type ProfileCollection = (typeof PROFILE_COLLECTIONS)[number];

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });
    if (profile) return profile;

    return this.prisma.candidateProfile.create({
      data: { userId },
      include: PROFILE_INCLUDE,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: dto,
      include: PROFILE_INCLUDE,
    });
  }

  async addExperience(userId: string, dto: CreateExperienceDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.experience.create({
      data: {
        profileId: profile.id,
        title: dto.title,
        company: dto.company,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
        description: dto.description,
      },
    });
  }

  async deleteExperience(userId: string, expId: string) {
    const profile = await this.getProfile(userId);
    const exp = await this.prisma.experience.findFirst({ where: { id: expId, profileId: profile.id } });
    if (!exp) throw new NotFoundException('Expérience introuvable');
    return this.prisma.experience.delete({ where: { id: expId } });
  }

  async addEducation(userId: string, dto: CreateEducationDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.education.create({
      data: {
        profileId: profile.id,
        school: dto.school,
        degree: dto.degree,
        field: dto.field,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async deleteEducation(userId: string, eduId: string) {
    const profile = await this.getProfile(userId);
    const edu = await this.prisma.education.findFirst({ where: { id: eduId, profileId: profile.id } });
    if (!edu) throw new NotFoundException('Formation introuvable');
    return this.prisma.education.delete({ where: { id: eduId } });
  }

  async addSkill(userId: string, dto: CreateSkillDto) {
    const profile = await this.getProfile(userId);
    const name = dto.name.trim();
    const duplicate = profile.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return duplicate;
    return this.prisma.skill.create({
      data: { profileId: profile.id, name, level: dto.level || 'INTERMEDIATE' },
    });
  }

  async addLanguage(userId: string, dto: CreateLanguageDto) {
    const profile = await this.getProfile(userId);
    const name = dto.name.trim();
    const duplicate = profile.languages.find((l) => l.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return duplicate;
    return this.prisma.language.create({
      data: { profileId: profile.id, name, level: dto.level || 'INTERMEDIAIRE' },
    });
  }

  async addCertification(userId: string, dto: CreateCertificationDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.certification.create({
      data: {
        profileId: profile.id,
        name: dto.name.trim(),
        issuer: dto.issuer,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
      },
    });
  }

  async addProject(userId: string, dto: CreateProjectDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.project.create({
      data: { profileId: profile.id, name: dto.name.trim(), description: dto.description, url: dto.url },
    });
  }

  async addAchievement(userId: string, dto: CreateAchievementDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.achievement.create({
      data: { profileId: profile.id, title: dto.title.trim(), description: dto.description },
    });
  }

  /** Suppression d'un élément d'une collection du profil, toujours scopée sur l'utilisateur connecté. */
  async deleteFromCollection(userId: string, collection: ProfileCollection, id: string) {
    const profile = await this.getProfile(userId);
    const delegate = this.prisma[
      ({
        skills: 'skill',
        languages: 'language',
        certifications: 'certification',
        projects: 'project',
        achievements: 'achievement',
      } as const)[collection]
    ] as any;

    const item = await delegate.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException('Élément introuvable');
    return delegate.delete({ where: { id } });
  }
}
