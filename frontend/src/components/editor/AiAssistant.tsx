'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useSchemas, type RefineValues } from '@/lib/validation';
import { useSectionTitle, type SectionDefinition } from '@/lib/labels';
import type { DocumentSection } from '@/lib/types';
import Button from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';

/**
 * 3e colonne de l'éditeur : affiner une section déjà rédigée.
 * Toute reformulation repart en proposition à valider — jamais un contenu final direct.
 */
export default function AiAssistant({
  definitions,
  sections,
  busy,
  onRefine,
}: {
  definitions: SectionDefinition[];
  sections: DocumentSection[];
  busy: boolean;
  onRefine: (values: RefineValues) => Promise<unknown>;
}) {
  const t = useTranslations('editor');
  const sectionTitle = useSectionTitle();
  const { refine } = useSchemas();

  // On ne peut affiner qu'une section qui a déjà un texte (validé ou proposé)
  const available = definitions.filter((def) => {
    const section = sections.find((s) => s.type === def.type);
    return !!section?.content?.trim() || !!section?.suggestions.some((s) => s.status === 'PENDING_CONFIRMATION');
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RefineValues>({
    resolver: zodResolver(refine),
    values: { sectionType: available[0]?.type ?? '', instruction: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await onRefine(values);
      reset({ sectionType: values.sectionType, instruction: '' });
    } catch {
      // erreur affichée par un toast
    }
  });

  return (
    <div className="bg-white rounded-3xl border border-[#F3E3D6] shadow-card p-5 space-y-4">
      <h2 className="font-bold text-base text-[#2E241F] flex items-center gap-2">
        <Sparkles size={18} className="text-[#FF7A59]" /> {t('assistantTitle')}
      </h2>
      <p className="text-sm text-[#83726A]">{t('assistantIntro')}</p>

      {available.length === 0 ? (
        <p className="text-sm text-[#83726A] p-3 rounded-xl bg-[#FFF9F3] border border-[#F3E3D6]">{t('noContent')}</p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <Select
            label={t('assistantSectionLabel')}
            options={available.map((def) => ({ value: def.type, label: sectionTitle(def.type) }))}
            error={errors.sectionType?.message}
            {...register('sectionType')}
          />
          <Textarea
            rows={3}
            label={t('assistantInstructionLabel')}
            placeholder={t('assistantPlaceholder')}
            error={errors.instruction?.message}
            {...register('instruction')}
          />
          <Button type="submit" fullWidth loading={isSubmitting || busy}>
            {isSubmitting ? t('assistantWorking') : t('assistantSubmit')}
          </Button>
        </form>
      )}

      <p className="text-sm text-[#1F7A4F] bg-[#DDF5E7]/60 p-3 rounded-xl flex items-start gap-2">
        <ShieldCheck size={15} className="shrink-0 mt-0.5" />
        {t('assistantHint')}
      </p>
    </div>
  );
}
