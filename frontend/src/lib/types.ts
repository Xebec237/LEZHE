export type DocumentType = 'CV' | 'COVER_LETTER' | 'RECOMMENDATION_LETTER';
export type DocumentStatus = 'DRAFT' | 'READY' | 'EXPORTED';
export type SuggestionStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'EDITED' | 'REJECTED';
export type LanguageLevel = 'NOTIONS' | 'INTERMEDIAIRE' | 'COURANT' | 'BILINGUE' | 'NATIF';

export interface SectionDefinition {
  type: string;
  order: number;
  essential: boolean;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface Skill {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface Language {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface Certification {
  id: string;
  name: string;
  issuer?: string | null;
  issuedAt?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  url?: string | null;
}

export interface Achievement {
  id: string;
  title: string;
  description?: string | null;
}

export interface Profile {
  id: string;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  careerGoal?: string | null;
  user: { fullName: string; email: string; phone?: string | null };
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  projects: Project[];
  achievements: Achievement[];
}

/** Extrait figé des faits utilisés par une proposition IA (traçabilité). */
export interface FactsSnapshot {
  profile?: { fullName?: string; headline?: string | null; careerGoal?: string | null };
  experiences?: Partial<Experience>[];
  educations?: Partial<Education>[];
  skills?: { name: string }[];
  languages?: { name: string }[];
  instruction?: string;
  refinedFrom?: string;
}

export interface AiSuggestion {
  id: string;
  kind: 'SECTION_CONTENT' | 'HIDDEN_SKILL';
  generatedContent: string;
  // Section : objet de faits ; compétence cachée : liste des expériences utilisées
  sourceFactsSnapshot: FactsSnapshot | Partial<Experience>[];
  status: SuggestionStatus;
  createdAt: string;
}

export interface DocumentSection {
  id: string;
  type: string;
  order: number;
  content: string | null;
  source: 'MANUAL' | 'AI_CONFIRMED' | 'AI_EDITED';
  suggestions: AiSuggestion[];
}

export interface ExportJob {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  createdAt: string;
  finishedAt?: string | null;
  errorMessage?: string | null;
}

export interface DocumentSummary {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  templateId: string;
  targetJob?: string | null;
  targetCountry?: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
  sections: { type: string; content: string | null }[];
  exportJobs: ExportJob[];
}

export interface DocumentDetail extends Omit<DocumentSummary, 'sections'> {
  sections: DocumentSection[];
  profile: Profile;
  essentialSections: string[];
  canExport: boolean;
}
