import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PROFILE_COLLECTIONS, ProfileCollection, ProfileService } from './profile.service';
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

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Request() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @Post('experiences')
  async addExperience(@Request() req: any, @Body() dto: CreateExperienceDto) {
    return this.profileService.addExperience(req.user.id, dto);
  }

  @Delete('experiences/:id')
  async deleteExperience(@Request() req: any, @Param('id') id: string) {
    return this.profileService.deleteExperience(req.user.id, id);
  }

  @Post('educations')
  async addEducation(@Request() req: any, @Body() dto: CreateEducationDto) {
    return this.profileService.addEducation(req.user.id, dto);
  }

  @Delete('educations/:id')
  async deleteEducation(@Request() req: any, @Param('id') id: string) {
    return this.profileService.deleteEducation(req.user.id, id);
  }

  @Post('skills')
  async addSkill(@Request() req: any, @Body() dto: CreateSkillDto) {
    return this.profileService.addSkill(req.user.id, dto);
  }

  @Post('languages')
  async addLanguage(@Request() req: any, @Body() dto: CreateLanguageDto) {
    return this.profileService.addLanguage(req.user.id, dto);
  }

  @Post('certifications')
  async addCertification(@Request() req: any, @Body() dto: CreateCertificationDto) {
    return this.profileService.addCertification(req.user.id, dto);
  }

  @Post('projects')
  async addProject(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.profileService.addProject(req.user.id, dto);
  }

  @Post('achievements')
  async addAchievement(@Request() req: any, @Body() dto: CreateAchievementDto) {
    return this.profileService.addAchievement(req.user.id, dto);
  }

  // Suppression commune : /profile/skills|languages|certifications|projects|achievements/:id
  @Delete(':collection/:id')
  async deleteItem(@Request() req: any, @Param('collection') collection: string, @Param('id') id: string) {
    if (!PROFILE_COLLECTIONS.includes(collection as ProfileCollection)) {
      throw new BadRequestException('Collection inconnue');
    }
    return this.profileService.deleteFromCollection(req.user.id, collection as ProfileCollection, id);
  }
}
