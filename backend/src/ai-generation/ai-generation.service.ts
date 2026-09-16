import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);
  private anthropic: Anthropic | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey && apiKey.trim() !== '') {
      this.anthropic = new Anthropic({ apiKey });
      this.logger.log('Anthropic Client initialisé avec succès');
    } else {
      this.logger.warn('Aucune clé ANTHROPIC_API_KEY détectée. Mode dégradé (Stub) actif pour le dev.');
    }
  }

  private readonly ZERO_FABRICATION_SYSTEM_PROMPT = `Tu es l'assistant de rédaction du SaaS Lezhe.
RÈGLE ABSOLUE "ZERO FABRICATION" :
Tu ne dois utiliser QUE les faits fournis dans le JSON facts. Interdiction absolue d'inventer, estimer ou extrapoler dates, employeurs, titres, chiffres, compétences, diplômes ou projets. Si une information manque, formule la section de manière élégante et professionnelle sans ajouter de détails imaginés.
Chaque fait présenté doit s'appuyer strictement sur les données transmises.
Rédige en français sous un ton clair, moderne, percutant et professionnel.`;

  async generateSectionContent(sectionType: string, targetJob: string | null, facts: any): Promise<string> {
    if (!this.anthropic) {
      return this.generateStubSection(sectionType, targetJob, facts);
    }

    try {
      const model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-sonnet-5';
      const prompt = `Génère le texte pour la section "${sectionType}"${targetJob ? ` ciblée pour le poste : "${targetJob}"` : ''}.
Voici l'ensemble des faits vérifiés du candidat à utiliser exclusivement :
${JSON.stringify(facts, null, 2)}`;

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 1000,
        system: this.ZERO_FABRICATION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = response.content[0];
      if (firstBlock && firstBlock.type === 'text') {
        return firstBlock.text.trim();
      }
      return this.generateStubSection(sectionType, targetJob, facts);
    } catch (err) {
      this.logger.error('Erreur lors de la génération Anthropic, bascule sur mode stub', err);
      return this.generateStubSection(sectionType, targetJob, facts);
    }
  }

  /**
   * Reformule un texte DÉJÀ produit, selon une consigne du candidat.
   * Le résultat repart en AiSuggestion à valider : ce n'est jamais un contenu final.
   */
  async refineSectionContent(currentText: string, instruction: string, facts: any): Promise<string> {
    if (!this.anthropic) {
      return this.refineStub(currentText, instruction);
    }

    try {
      const model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-sonnet-5';
      const prompt = `Reformule le texte ci-dessous en suivant la consigne du candidat.
INTERDIT : ajouter un fait absent du JSON facts (date, employeur, chiffre, diplôme, compétence).
Si la consigne demande d'ajouter une information qui n'existe pas dans les faits, garde le texte sans elle.
Réponds uniquement par le texte reformulé.

Consigne du candidat : "${instruction}"

Texte actuel :
${currentText}

Faits vérifiés disponibles :
${JSON.stringify(facts, null, 2)}`;

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 1000,
        system: this.ZERO_FABRICATION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = response.content[0];
      if (firstBlock && firstBlock.type === 'text') {
        return firstBlock.text.trim();
      }
      return this.refineStub(currentText, instruction);
    } catch (err) {
      this.logger.error('Erreur reformulation Anthropic, bascule sur mode stub', err);
      return this.refineStub(currentText, instruction);
    }
  }

  async suggestHiddenSkills(experiences: any[]): Promise<string[]> {
    if (!this.anthropic) {
      return this.generateStubSkills(experiences);
    }

    try {
      const model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-sonnet-5';
      const prompt = `Analyse les expériences du candidat ci-dessous et extrait les compétences transférables ou cachées implicitement démontrées par ses tâches.
RÈGLE STRICTE : Ne suggère que des compétences directement soutenues par les faits décrits.
Renvoie exclusivement un tableau JSON de chaînes de caractères (ex: ["Organisation", "Gestion de projet"]).

Expériences :
${JSON.stringify(experiences, null, 2)}`;

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 500,
        system: this.ZERO_FABRICATION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = response.content[0];
      if (firstBlock && firstBlock.type === 'text') {
        const jsonMatch = firstBlock.text.match(/\[.*\]/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim());
        }
      }
      return this.generateStubSkills(experiences);
    } catch (err) {
      this.logger.error('Erreur suggestion compétences Anthropic', err);
      return this.generateStubSkills(experiences);
    }
  }

  // Mode dégradé (sans clé API) : texte de test assemblé UNIQUEMENT à partir des faits fournis.
  private generateStubSection(sectionType: string, targetJob: string | null, facts: any): string {
    const headline: string | undefined = facts.profile?.headline || undefined;
    const experiences: any[] = facts.experiences || [];
    const educations: any[] = facts.educations || [];
    const skills: string[] = (facts.skills || []).map((s: any) => s.name);
    const expList = experiences.map((e) => `${e.title} chez ${e.company}`).join(', ');
    const type = sectionType.toUpperCase();

    if (type === 'SUMMARY') {
      const parts: string[] = [];
      if (headline) parts.push(headline + '.');
      if (expList) parts.push(`Expérience : ${expList}.`);
      if (educations[0]) parts.push(`Formation : ${educations[0].degree} (${educations[0].school}).`);
      if (skills.length) parts.push(`Compétences : ${skills.slice(0, 5).join(', ')}.`);
      if (targetJob) parts.push(`Objectif : ${targetJob}.`);
      return parts.join(' ') || 'Ajoute des informations à ton profil pour que Lezhe puisse rédiger ce résumé.';
    }

    if (type.startsWith('EXPERIENCE')) {
      const exp = experiences[0];
      if (!exp) return 'Aucune expérience saisie dans ton profil pour le moment.';
      return `${exp.title} — ${exp.company}${exp.location ? ` (${exp.location})` : ''}.${exp.description ? `\n${exp.description}` : ''}`;
    }

    if (type === 'SKILLS_SUMMARY') {
      return skills.length
        ? `Compétences confirmées : ${skills.join(', ')}.`
        : 'Aucune compétence confirmée pour le moment.';
    }

    if (type === 'COVER_LETTER_BODY') {
      return [
        `Objet : candidature${targetJob ? ` au poste de ${targetJob}` : ''}`,
        '',
        'Madame, Monsieur,',
        '',
        expList
          ? `Mon parcours comprend les expériences suivantes : ${expList}.`
          : 'Je vous adresse ma candidature.',
        skills.length ? `Mes compétences confirmées : ${skills.join(', ')}.` : '',
        '',
        'Je reste à votre disposition pour un entretien.',
        '',
        'Cordialement,',
        facts.profile?.fullName || '',
      ]
        .filter((line, i, arr) => line !== '' || arr[i - 1] !== '')
        .join('\n')
        .trim();
    }

    if (type === 'RECOMMENDATION_LETTER_BODY') {
      const exp = experiences[0];
      return [
        'À qui de droit,',
        '',
        exp
          ? `${facts.profile?.fullName || 'Le/la candidat(e)'} a occupé le poste de ${exp.title} chez ${exp.company}.`
          : `${facts.profile?.fullName || 'Le/la candidat(e)'} sollicite cette recommandation.`,
        exp?.description ? `Missions : ${exp.description}` : '',
        skills.length ? `Compétences confirmées : ${skills.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    return expList ? `Faits utilisés : ${expList}.` : 'Aucun fait disponible pour cette section.';
  }

  // Mode dégradé : on ne peut que réorganiser le texte existant, jamais l'enrichir.
  private refineStub(currentText: string, instruction: string): string {
    const wantsShorter = /court|raccourci|résume|resume|bref|concis/i.test(instruction);
    const sentences = currentText.split(/(?<=[.!?])\s+/).filter(Boolean);

    if (wantsShorter && sentences.length > 1) {
      return `${sentences.slice(0, Math.ceil(sentences.length / 2)).join(' ')}\n\n(Mode test sans clé API : texte raccourci, aucun fait ajouté.)`;
    }
    return `${currentText}\n\n(Mode test sans clé API : aucune reformulation possible sans inventer de faits.)`;
  }

  // Mode dégradé : déduction par mots-clés présents dans les expériences réellement saisies.
  private generateStubSkills(experiences: any[]): string[] {
    const rules: [RegExp, string[]][] = [
      [/organis|planifi|coordon|command|stock|logisti/i, ['Organisation', 'Gestion des priorités']],
      [/client|accueil|vente|vendeu|commercial/i, ['Relation client', 'Communication']],
      [/équipe|equipe|supervis|manag|encadr|lead|responsable/i, ['Encadrement d’équipe', 'Leadership']],
      [/dév|dev|code|logiciel|web|informatique|tech/i, ['Résolution de problèmes', 'Analyse technique']],
      [/budget|compta|financ|factur|caisse/i, ['Gestion budgétaire', 'Rigueur']],
      [/form|enseign|cours|tutor/i, ['Pédagogie', 'Transmission des savoirs']],
      [/projet|project/i, ['Gestion de projet']],
    ];
    const text = experiences.map((e) => `${e.title ?? ''} ${e.description ?? ''}`).join(' ');
    const suggested = rules.filter(([re]) => re.test(text)).flatMap(([, names]) => names);
    return Array.from(new Set(suggested.length ? suggested : ['Adaptabilité', 'Sens des responsabilités']));
  }
}
