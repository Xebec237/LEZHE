'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, FileText, User, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useIsAuthenticated } from '@/lib/auth';
import { useDocumentTypeLabels } from '@/lib/labels';
import type { DocumentType } from '@/lib/types';
import Modal from '@/components/ui/Modal';

const HIDDEN_ON = ['/', '/login', '/register', '/pricing', '/onboarding'];
const CREATE_TYPES: DocumentType[] = ['CV', 'COVER_LETTER', 'RECOMMENDATION_LETTER'];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuth = useIsAuthenticated();
  const t = useTranslations('nav');
  const typeLabels = useDocumentTypeLabels();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  if (isAuth !== true || HIDDEN_ON.includes(pathname)) return null;

  const createDocument = (type: DocumentType) => {
    setShowCreateMenu(false);
    router.push(`/documents/new?type=${type}`);
  };

  const tab = (href: string, label: string, Icon: typeof Home, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col items-center gap-1 text-xs font-medium min-w-14 ${active ? 'text-[#FF7A59]' : 'text-[#83726A]'}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      <Modal open={showCreateMenu} onClose={() => setShowCreateMenu(false)} title={t('createQuestion')} variant="sheet">
        <div className="space-y-2.5">
          {CREATE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => createDocument(type)}
              className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FFE8DC] border border-[#F3E3D6] flex items-center justify-between transition"
            >
              <span className="font-semibold text-base text-[#2E241F]">{typeLabels[type]}</span>
              <span className="text-[#FF7A59] font-bold text-lg" aria-hidden>
                →
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <nav
        aria-label={t('mobileNav')}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF9F3]/95 backdrop-blur-md border-t border-[#F3E3D6] px-4 pt-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          {tab('/dashboard', t('home'), Home, pathname === '/dashboard')}
          {tab('/documents', t('documents'), FileText, pathname.startsWith('/documents'))}
          <div className="relative -top-5">
            <button
              onClick={() => setShowCreateMenu(true)}
              className="w-14 h-14 rounded-full bg-[#FF7A59] text-white flex items-center justify-center shadow-lg ring-4 ring-[#FFF9F3] active:scale-95 transition-transform"
              aria-label={t('createDocument')}
              aria-haspopup="dialog"
            >
              <Plus size={28} />
            </button>
          </div>
          {tab('/skills/discover', t('skills'), Sparkles, pathname.startsWith('/skills'))}
          {tab('/profile', t('profile'), User, pathname === '/profile')}
        </div>
      </nav>
    </>
  );
}
