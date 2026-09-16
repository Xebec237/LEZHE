'use client';

import { useTranslations } from 'next-intl';
import { Trash2, Plus } from 'lucide-react';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export interface CollectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string | null;
}

/**
 * Section générique du profil (formation, langues, certifications, projets, réalisations) :
 * liste des faits enregistrés + formulaire d'ajout. Évite de redupliquer six fois la même carte.
 */
export default function CollectionSection({
  icon,
  title,
  emptyText,
  addTitle,
  items,
  onDelete,
  children,
  submitting,
  onSubmit,
}: {
  icon: React.ReactNode;
  title: string;
  emptyText: string;
  addTitle: string;
  items: CollectionItem[];
  onDelete: (item: CollectionItem) => void;
  children: React.ReactNode;
  submitting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  const t = useTranslations('profile');
  const tc = useTranslations('common');

  return (
    <Card className="space-y-5" aria-label={title}>
      <CardTitle icon={icon}>{title}</CardTitle>

      {items.length === 0 ? (
        <p className="text-sm text-[#83726A]">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#F3E3D6] flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="font-bold text-[#2E241F]">{item.title}</div>
                {item.subtitle && <div className="text-sm text-[#83726A]">{item.subtitle}</div>}
                {item.description && <p className="text-sm text-[#2E241F] whitespace-pre-line">{item.description}</p>}
              </div>
              <button
                onClick={() => onDelete(item)}
                aria-label={t('deleteItemLabel', { title: item.title })}
                className="text-[#E2645A] hover:bg-[#FBE7E5] p-2 rounded-lg transition shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} noValidate className="p-4 rounded-2xl border border-dashed border-[#FF7A59]/40 bg-[#FFE8DC]/20 space-y-3">
        <div className="text-sm font-bold text-[#9A3A20]">{addTitle}</div>
        {children}
        <Button type="submit" loading={submitting}>
          <Plus size={16} /> {tc('add')}
        </Button>
      </form>
    </Card>
  );
}
