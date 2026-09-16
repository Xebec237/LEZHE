import { IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DocumentType } from '@prisma/client';

export const TEMPLATE_IDS = ['ats', 'minimal', 'modern'] as const;

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsIn(TEMPLATE_IDS)
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetJob?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetCountry?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsIn(TEMPLATE_IDS)
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetJob?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetCountry?: string;
}

export class GenerateSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionType: string;

  @IsInt()
  order: number;
}

export class ConfirmSuggestionDto {
  @IsString()
  @IsNotEmpty()
  suggestionId: string;

  @IsEnum(['CONFIRM', 'EDIT', 'REJECT'])
  action: 'CONFIRM' | 'EDIT' | 'REJECT';

  @IsOptional()
  @IsString()
  editedContent?: string;
}

export class ManualSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionType: string;

  @IsInt()
  order: number;

  @IsString()
  content: string;
}

export class RefineSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionType: string;

  @IsString()
  @IsNotEmpty({ message: 'Explique ce que tu veux changer' })
  @MaxLength(300)
  instruction: string;
}
